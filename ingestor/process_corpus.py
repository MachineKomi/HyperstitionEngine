import os
import json
import pdfplumber
import spacy
from tqdm import tqdm
from collections import defaultdict

# Configuration
RAW_CORPUS_DIR = "../raw_corpus_source"
OUTPUT_DIR = "../src/assets/corpus"
NLP_MODEL = "en_core_web_sm"

def ensure_directories():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

def clean_text(text):
    if not text:
        return ""
    # Basic cleaning: remove excessive whitespace, etc.
    return " ".join(text.split())

def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + " "
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return text

def process_folder(folder_name, nlp):
    folder_path = os.path.join(RAW_CORPUS_DIR, folder_name)
    if not os.path.exists(folder_path):
        print(f"Warning: Folder {folder_path} not found.")
        return None

    full_text = ""
    print(f"Processing {folder_name}...")
    
    files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf') or f.lower().endswith('.txt')]
    
    for filename in tqdm(files, desc=f"Reading files in {folder_name}"):
        file_path = os.path.join(folder_path, filename)
        if filename.lower().endswith('.pdf'):
            full_text += extract_text_from_pdf(file_path) + " "
        elif filename.lower().endswith('.txt'):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    full_text += f.read() + " "
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

    cleaned_text = clean_text(full_text)
    
    # NLP Processing
    doc = nlp(cleaned_text[:1000000]) # Limit to 1M chars for now to avoid memory issues if huge
    
    pos_data = defaultdict(list)
    tokens = []

    for token in doc:
        if not token.is_stop and not token.is_punct and not token.is_space:
            if token.pos_ == "NOUN":
                pos_data["nouns"].append(token.text)
            elif token.pos_ == "VERB":
                pos_data["verbs"].append(token.text)
            elif token.pos_ == "ADJ":
                pos_data["adjectives"].append(token.text)
        
        # Keep some punctuation for Markov chains? For now, just words.
        # Actually, for Markov chains, we usually want sentences or at least punctuation.
        # Let's keep the raw text for Markov, and use the POS lists for templates.
        pass

    # For Markov, we might just want the raw text split by sentences or just the big blob.
    # The requirement says "raw tokens (for Markov generation)". 
    # Let's save the raw text as a list of sentences for easier Markov training.
    sentences = [sent.text.strip() for sent in doc.sents]

    return {
        "id": folder_name,
        "sentences": sentences,
        "pos": {
            "nouns": list(set(pos_data["nouns"])), # Deduplicate
            "verbs": list(set(pos_data["verbs"])),
            "adjectives": list(set(pos_data["adjectives"]))
        }
    }

def main():
    ensure_directories()
    
    print("Loading NLP model...")
    try:
        nlp = spacy.load(NLP_MODEL)
    except OSError:
        print(f"Model {NLP_MODEL} not found. Please run: python -m spacy download {NLP_MODEL}")
        return

    sub_folders = [
        "N_Land", "Bible", "Marcus_A", "M_Cicero", "F_Nietzsche", 
        "Yokai", "Confucius", "GoBadukWeiqi", "N_Bostrom", 
        "Y_Harari", "AI"
    ]

    for folder in sub_folders:
        data = process_folder(folder, nlp)
        if data:
            output_path = os.path.join(OUTPUT_DIR, f"{folder}.json")
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Saved {output_path}")

if __name__ == "__main__":
    main()
