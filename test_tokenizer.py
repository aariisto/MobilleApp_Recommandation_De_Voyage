from transformers import AutoTokenizer
from sentence_transformers import SentenceTransformer

# Charger le tokenizer
tokenizer = AutoTokenizer.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')

# Texte de test
text = 'accommodation.hotel place_of_worship'

# Tokenization
tokens = tokenizer(text, padding='max_length', max_length=128, truncation=True, return_tensors='pt')

print('Input IDs:', tokens['input_ids'][0][:20].tolist())
print('Attention Mask:', tokens['attention_mask'][0][:20].tolist())
print('Token Type IDs:', tokens['token_type_ids'][0][:20].tolist() if 'token_type_ids' in tokens else 'N/A')

# Décoder les tokens
decoded = [tokenizer.decode([id]) for id in tokens['input_ids'][0][:20]]
print('Decoded tokens:', decoded)

# Test embedding
model = SentenceTransformer('all-MiniLM-L6-v2')
embedding = model.encode(text)
print(f'\nEmbedding shape: {embedding.shape}')
print(f'First 5 values: {embedding[:5]}')
print(f'Norm: {(embedding ** 2).sum() ** 0.5}')
