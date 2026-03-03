"""
Faz 3.1: Fine-tuned Gemma LoRA modelini test etme script'i
Base model vs Fine-tuned model karşılaştırması
"""

import torch
from pathlib import Path
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import time


# Configuration
BASE_MODEL = "google/gemma-2-2b-it"
LORA_MODEL_DIR = Path("../models/gemma-2-2b-mekan-lora")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# Test queries
TEST_QUERIES = [
    {
        "query": "Sakin bir kafede laptop ile çalışmak istiyorum, wifi şart",
        "context": "Konum: Kadıköy, Zaman: sabah, Bütçe: orta",
        "expected_features": ["wifi", "sessiz", "laptop dostu"]
    },
    {
        "query": "Sevgilimle romantik bir akşam yemeği için restoran arıyorum",
        "context": "Konum: Bebek, Zaman: akşam, Bütçe: yüksek",
        "expected_features": ["romantik", "manzaralı", "şık"]
    },
    {
        "query": "Arkadaşlarla eğlenceli bir akşam geçireceğimiz canlı bar",
        "context": "Konum: Beyoğlu, Zaman: gece, Bütçe: orta",
        "expected_features": ["canlı müzik", "eğlenceli", "enerji"]
    },
    {
        "query": "Ailece gidebileceğimiz park ve restoran",
        "context": "Konum: Sarıyer, Zaman: hafta sonu, Bütçe: orta",
        "expected_features": ["aile dostu", "çocuk", "açık hava"]
    }
]


def load_base_model():
    """Base Gemma modelini yükle"""
    print("\n📦 Base model yükleniyor...")
    
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        device_map="auto" if DEVICE == "cuda" else None,
        torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
        trust_remote_code=True
    )
    
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    print(f"  ✓ Base model yüklendi: {BASE_MODEL}")
    return model, tokenizer


def load_fine_tuned_model():
    """Fine-tuned LoRA modelini yükle"""
    print("\n📦 Fine-tuned model yükleniyor...")
    
    if not LORA_MODEL_DIR.exists():
        raise FileNotFoundError(f"LoRA model bulunamadı: {LORA_MODEL_DIR}")
    
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    
    # Base model
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        device_map="auto" if DEVICE == "cuda" else None,
        torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
        trust_remote_code=True
    )
    
    # LoRA adaptörlerini yükle
    model = PeftModel.from_pretrained(base_model, str(LORA_MODEL_DIR))
    model = model.merge_and_unload()  # LoRA weights'i base model ile merge et
    
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    print(f"  ✓ Fine-tuned model yüklendi: {LORA_MODEL_DIR}")
    return model, tokenizer


def create_prompt(query: str, context: str) -> str:
    """Test için prompt oluştur"""
    instruction = f"""Sen İstanbul'da mekan önerisi yapan bir yapay zeka asistanısın. 
Kullanıcının isteğine göre en uygun mekanları öner ve neden önerdiğini açıkla.

Kullanıcı: {query}
Kullanıcı Bilgileri: {context}"""
    
    return instruction


def generate_response(model, tokenizer, prompt: str, max_new_tokens: int = 512) -> str:
    """Model response generate et"""
    
    # Chat template
    chat = [{"role": "user", "content": prompt}]
    formatted = tokenizer.apply_chat_template(
        chat,
        tokenize=False,
        add_generation_prompt=True
    )
    
    # Tokenize
    inputs = tokenizer(formatted, return_tensors="pt", padding=True)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}
    
    # Generate
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.7,
            top_p=0.9,
            do_sample=True,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id
        )
    
    # Decode
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Extract assistant response
    if "<start_of_turn>model" in response:
        response = response.split("<start_of_turn>model")[-1].strip()
    elif "assistant" in response.lower():
        parts = response.split("assistant", 1)
        if len(parts) > 1:
            response = parts[1].strip()
    
    return response


def evaluate_response(response: str, expected_features: list) -> dict:
    """Response kalitesini değerlendir"""
    
    response_lower = response.lower()
    
    # Feature mentions
    feature_score = sum(1 for f in expected_features if f.lower() in response_lower)
    feature_ratio = feature_score / len(expected_features) if expected_features else 0
    
    # Length
    word_count = len(response.split())
    
    # Structure (mekan listesi var mı?)
    has_structure = any(marker in response for marker in ["1.", "2.", "📍", "**", "-"])
    
    # Turkish fluency (basit check)
    turkish_words = ["için", "ile", "mekan", "restoran", "kafe", "öner", "uygun"]
    turkish_score = sum(1 for w in turkish_words if w in response_lower) / len(turkish_words)
    
    return {
        "feature_coverage": feature_ratio,
        "word_count": word_count,
        "has_structure": has_structure,
        "turkish_fluency": turkish_score
    }


def compare_models(test_case: dict):
    """Base ve fine-tuned model'i karşılaştır"""
    
    query = test_case["query"]
    context = test_case["context"]
    expected = test_case["expected_features"]
    
    print("\n" + "=" * 80)
    print(f"📋 TEST: {query}")
    print(f"📍 Context: {context}")
    print("=" * 80)
    
    prompt = create_prompt(query, context)
    
    # Base model
    print("\n⏱️ Base model response generating...")
    start_time = time.time()
    base_response = generate_response(base_model, base_tokenizer, prompt)
    base_time = time.time() - start_time
    base_eval = evaluate_response(base_response, expected)
    
    print(f"\n🤖 BASE MODEL ({base_time:.2f}s):")
    print("-" * 80)
    print(base_response[:500] + "..." if len(base_response) > 500 else base_response)
    print(f"\n📊 Evaluation:")
    print(f"  Feature Coverage: {base_eval['feature_coverage']*100:.1f}%")
    print(f"  Word Count: {base_eval['word_count']}")
    print(f"  Has Structure: {'✓' if base_eval['has_structure'] else '✗'}")
    print(f"  Turkish Fluency: {base_eval['turkish_fluency']*100:.1f}%")
    
    # Fine-tuned model
    print("\n⏱️ Fine-tuned model response generating...")
    start_time = time.time()
    ft_response = generate_response(ft_model, ft_tokenizer, prompt)
    ft_time = time.time() - start_time
    ft_eval = evaluate_response(ft_response, expected)
    
    print(f"\n🎯 FINE-TUNED MODEL ({ft_time:.2f}s):")
    print("-" * 80)
    print(ft_response[:500] + "..." if len(ft_response) > 500 else ft_response)
    print(f"\n📊 Evaluation:")
    print(f"  Feature Coverage: {ft_eval['feature_coverage']*100:.1f}%")
    print(f"  Word Count: {ft_eval['word_count']}")
    print(f"  Has Structure: {'✓' if ft_eval['has_structure'] else '✗'}")
    print(f"  Turkish Fluency: {ft_eval['turkish_fluency']*100:.1f}%")
    
    # Comparison
    print(f"\n📈 COMPARISON:")
    print("-" * 80)
    coverage_diff = (ft_eval['feature_coverage'] - base_eval['feature_coverage']) * 100
    print(f"  Feature Coverage: {'+' if coverage_diff > 0 else ''}{coverage_diff:.1f}%")
    
    if ft_eval['turkish_fluency'] > base_eval['turkish_fluency']:
        print(f"  ✅ Fine-tuned model daha akıcı Türkçe")
    
    if ft_eval['has_structure'] and not base_eval['has_structure']:
        print(f"  ✅ Fine-tuned model daha yapılandırılmış")
    
    return {
        "base": base_eval,
        "fine_tuned": ft_eval,
        "improvement": {
            "feature_coverage": coverage_diff,
            "time_diff": ft_time - base_time
        }
    }


def main():
    print("=" * 80)
    print("🧪 FAZ 3.1: FINE-TUNED MODEL TEST & COMPARISON")
    print("=" * 80)
    
    # Check if fine-tuned model exists
    if not LORA_MODEL_DIR.exists():
        print(f"\n❌ Fine-tuned model bulunamadı: {LORA_MODEL_DIR}")
        print("💡 Önce fine-tuning çalıştır:")
        print("   python scripts/fine_tune_gemma_lora.py")
        return
    
    # GPU info
    if DEVICE == "cuda":
        print(f"\n🎮 GPU: {torch.cuda.get_device_name(0)}")
        print(f"💾 VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    else:
        print("\n💻 CPU modunda çalışıyor")
    
    # Load models
    global base_model, base_tokenizer, ft_model, ft_tokenizer
    
    base_model, base_tokenizer = load_base_model()
    ft_model, ft_tokenizer = load_fine_tuned_model()
    
    # Run tests
    print("\n🧪 Test case'ler çalıştırılıyor...\n")
    
    results = []
    for i, test_case in enumerate(TEST_QUERIES, 1):
        print(f"\n{'='*80}")
        print(f"TEST {i}/{len(TEST_QUERIES)}")
        print(f"{'='*80}")
        
        result = compare_models(test_case)
        results.append(result)
        
        # Pause between tests
        if i < len(TEST_QUERIES):
            print("\n⏸️ Sonraki test için hazırlanıyor...\n")
            time.sleep(2)
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 GENEL ÖZET")
    print("=" * 80)
    
    avg_base_coverage = sum(r['base']['feature_coverage'] for r in results) / len(results)
    avg_ft_coverage = sum(r['fine_tuned']['feature_coverage'] for r in results) / len(results)
    
    print(f"\n📈 Ortalama Feature Coverage:")
    print(f"  Base Model:       {avg_base_coverage*100:.1f}%")
    print(f"  Fine-tuned Model: {avg_ft_coverage*100:.1f}%")
    print(f"  Improvement:      {(avg_ft_coverage - avg_base_coverage)*100:+.1f}%")
    
    base_structured = sum(1 for r in results if r['base']['has_structure'])
    ft_structured = sum(1 for r in results if r['fine_tuned']['has_structure'])
    
    print(f"\n📝 Yapılandırılmış Response:")
    print(f"  Base Model:       {base_structured}/{len(results)}")
    print(f"  Fine-tuned Model: {ft_structured}/{len(results)}")
    
    # Recommendation
    print("\n" + "=" * 80)
    if avg_ft_coverage > avg_base_coverage:
        print("✅ SONUÇ: Fine-tuned model base model'den daha iyi performans gösteriyor!")
        print("💡 Önerilen: Fine-tuned model'i production'da kullan")
    else:
        print("⚠️ SONUÇ: Fine-tuned model beklenenden düşük performans")
        print("💡 Önerilen: Training data veya hyperparameter'ları gözden geçir")
    
    print("=" * 80)


if __name__ == "__main__":
    main()
