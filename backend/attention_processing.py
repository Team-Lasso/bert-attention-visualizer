import torch
import numpy as np
import networkx as nx
from typing import List, Dict, Any, Optional, Tuple

#############################################
# Attention Rollout Calculation Function
#############################################
def compute_attention_rollout(attentions, add_identity: bool = True, debug: bool = False):
    """
    Compute attention rollout from raw attention matrices
    
    Args:
        attentions: List of attention tensors from the model
        add_identity: Whether to add identity matrix to each attention layer
        debug: Whether to print debug information
        
    Returns:
        The attention rollout matrix
    """
    num_layers = len(attentions)
    seq_len = attentions[0].size(-1)
    rollout = torch.eye(seq_len)
    for i, att in enumerate(attentions):
        att_avg = att.squeeze(0).mean(dim=0)
        if add_identity:
            att_aug = att_avg + torch.eye(seq_len)
        else:
            att_aug = att_avg
        att_aug = att_aug / (att_aug.sum(dim=-1, keepdim=True) + 1e-8)
        att_aug = torch.nan_to_num(att_aug, nan=0.0, posinf=0.0, neginf=0.0)
        rollout = rollout @ att_aug
        if debug:
            print(f"[DEBUG] Rollout after layer {i+1}:")
            print(att_aug)
            print(rollout)
    
    # Normalize rollout to ensure it sums to 1.0 exactly
    rollout_sum = rollout.sum(dim=-1, keepdim=True)
    # Handle zero sums to avoid division by zero
    is_zero_sum = (rollout_sum == 0)
    if is_zero_sum.any():
        # For rows with zero sum, distribute evenly
        seq_len = rollout.size(-1)
        even_dist = torch.ones_like(rollout) / seq_len
        rollout = torch.where(is_zero_sum, even_dist, rollout / rollout_sum)
    else:
        rollout = rollout / rollout_sum
        
    return rollout

#############################################
# Capacity Graph Construction Function (for Flow)
#############################################
def build_graph(joint_attentions, input_tokens, remove_diag: bool = False, debug: bool = False):
    """
    Build a graph representation for attention flow computation
    
    Args:
        joint_attentions: Joint attention matrices
        input_tokens: List of input token text
        remove_diag: Whether to remove diagonal elements (self-attention)
        debug: Whether to print debug information
        
    Returns:
        Tuple of (capacity matrix, node labels dictionary)
    """
    n_layers, seq_len, _ = joint_attentions.shape
    total_nodes = (n_layers + 1) * seq_len
    capacity = np.zeros((total_nodes, total_nodes))
    labels = {}
    for k in range(seq_len):
        labels[k] = f"0_{k}_{input_tokens[k]}"
    for i in range(1, n_layers + 1):
        for k_to in range(seq_len):
            node_to = i * seq_len + k_to
            labels[node_to] = f"L{i}_{k_to}"
            for k_from in range(seq_len):
                if remove_diag and (k_from == k_to):
                    continue
                node_from = (i - 1) * seq_len + k_from
                cap = joint_attentions[i - 1][k_from][k_to]
                capacity[node_from][node_to] = cap
                if debug:
                    print(f"[DEBUG] Edge from {labels[node_from]} to {labels[node_to]} with capacity: {cap:.6f}")
    return capacity, labels

#############################################
# Attention Flow Calculation Function (using networkx)
#############################################
def compute_attention_flow_networkx(attentions, add_identity: bool = True, debug: bool = False, mask_idx=None):
    """
    Compute attention flow using networkx max flow algorithm
    
    Args:
        attentions: List of attention tensors from the model
        add_identity: Whether to add identity matrix to each attention layer
        debug: Whether to print debug information
        mask_idx: Index of token to compute flow from (if None, computes flow for all tokens)
        
    Returns:
        Flow matrix or vector depending on mask_idx
    """
    num_layers = len(attentions)
    seq_len = attentions[0].size(-1)
    joint_attentions = []
    for att in attentions:
        att_avg = att.squeeze(0).mean(dim=0)
        if add_identity:
            alpha = 0.5
            att_aug = (att_avg + torch.eye(seq_len)) * alpha
        else:
            att_aug = att_avg
        att_aug = att_aug / (att_aug.sum(dim=-1, keepdim=True) + 1e-8)
        joint_attentions.append(att_aug.cpu().numpy())
    joint_attentions = np.stack(joint_attentions, axis=0)
    input_tokens = [str(i) for i in range(seq_len)]
    capacity, labels = build_graph(joint_attentions, input_tokens, remove_diag=False, debug=debug)
    total_nodes = capacity.shape[0]
    G = nx.DiGraph()
    for u in range(total_nodes):
        for v in range(total_nodes):
            cap = capacity[u][v]
            if cap > 1e-8:
                G.add_edge(u, v, capacity=float(cap))
    if mask_idx is not None:
        source = mask_idx
        flow_vector = np.zeros(seq_len)
        if debug:
            print(f"[DEBUG] Networkx max flow from {labels[source]} to each output node:")
        for sink in range(num_layers * seq_len, (num_layers + 1) * seq_len):
            try:
                flow_value, _ = nx.maximum_flow(G, source, sink, capacity='capacity')
            except Exception:
                flow_value = 0
            flow_vector[sink - num_layers * seq_len] = flow_value
        flow_vector = flow_vector / (flow_vector.sum() + 1e-8)
        return flow_vector.reshape(1, seq_len)
    else:
        flow_matrix = np.zeros((seq_len, seq_len))
        if debug:
            print("[DEBUG] Networkx max flow for each input node to each output node:")
        for i in range(seq_len):
            source = i
            flow_vector = np.zeros(seq_len)
            for sink in range(num_layers * seq_len, (num_layers + 1) * seq_len):
                try:
                    flow_value, _ = nx.maximum_flow(G, source, sink, capacity='capacity')
                except Exception:
                    flow_value = 0
                flow_vector[sink - num_layers * seq_len] = flow_value
            # Normalize flow vector to ensure it sums to 1.0 exactly
            flow_sum = flow_vector.sum()
            if flow_sum > 0:
                flow_vector = flow_vector / flow_sum
            else:
                # If there is no flow, distribute evenly
                flow_vector = np.ones(seq_len) / seq_len
            flow_matrix[i] = flow_vector
        if debug:
            print("[DEBUG] Final networkx flow matrix:")
            print(flow_matrix)
        return flow_matrix

#############################################
# Process Attention with Selected Method
#############################################
def process_attention_with_method(attention_matrices, method: str = "raw", debug: bool = False) -> List[Dict[str, Any]]:
    """
    Process attention matrices using the specified method
    
    Args:
        attention_matrices: List of attention tensors from the model
        method: Method to use (raw, rollout, flow)
        debug: Whether to print debug information
        
    Returns:
        Processed attention data in the same format as the original attention data
    """
    if method == "raw":
        # Return raw attention as is
        return attention_matrices
    
    # Convert to list if it's a tuple
    if isinstance(attention_matrices, tuple):
        attention_matrices = list(attention_matrices)
    
    # Get dimensions
    num_layers = len(attention_matrices)
    
    if method == "rollout":
        # Calculate rollout attention
        rollout_matrix = compute_attention_rollout(attention_matrices, add_identity=True, debug=debug)
        
        # Create new attention matrices with rollout values
        new_attention_matrices = []
        for layer_idx in range(num_layers):
            # For each layer, we'll use the same rollout matrix for all heads
            heads = attention_matrices[layer_idx].shape[1]  # Number of heads
            layer_data = {"layerIndex": layer_idx, "heads": []}
            
            for head_idx in range(heads):
                # Convert rollout matrix to list format for this head
                attention_matrix = rollout_matrix.cpu().tolist()
                
                layer_data["heads"].append({
                    "headIndex": head_idx,
                    "attention": attention_matrix
                })
            
            new_attention_matrices.append(layer_data)
        
        return new_attention_matrices
    
    elif method == "flow":
        # Calculate flow attention
        flow_matrix = compute_attention_flow_networkx(attention_matrices, add_identity=True, debug=debug)
        
        # Create new attention matrices with flow values
        new_attention_matrices = []
        for layer_idx in range(num_layers):
            # For each layer, we'll use the same flow matrix for all heads
            heads = attention_matrices[layer_idx].shape[1]  # Number of heads
            layer_data = {"layerIndex": layer_idx, "heads": []}
            
            for head_idx in range(heads):
                # Convert flow matrix to list format for this head
                attention_matrix = flow_matrix.tolist()
                
                layer_data["heads"].append({
                    "headIndex": head_idx,
                    "attention": attention_matrix
                })
            
            new_attention_matrices.append(layer_data)
        
        return new_attention_matrices
    
    else:
        raise ValueError(f"Unknown attention processing method: {method}") 