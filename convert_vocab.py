import json
import os

input_path = 'frontend/assets/models/vocab.txt'
output_path = 'frontend/assets/models/vocab.json'

print(f"Reading from {os.path.abspath(input_path)}")

try:
    with open(input_path, 'r', encoding='utf-8') as f:
        # Use rstrip to remove newline but keep content
        tokens = [line.rstrip('\n') for line in f]
        
    # Filter out empty lines if any at the end? 
    # BERT vocab usually has fixed size.
    # If the last line is empty due to trailing newline, readlines() handles it but let's be careful.
    if tokens and tokens[-1] == '':
        tokens.pop()

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(tokens, f)

    print(f"Successfully converted {len(tokens)} tokens to {output_path}")

except Exception as e:
    print(f"Error: {e}")
