import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  AIGenerateOptions,
  ChatMessage,
} from '../interfaces/ai-agent.interface';

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private readonly ai: GoogleGenAI;
  private readonly modelName: string = 'gemini-2.5-flash';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_AI_API_KEY');
    
    if (!apiKey) {
      this.logger.warn(
        '⚠️  GOOGLE_AI_API_KEY not configured. AI agent will not work!',
      );
    }
    
    this.ai = new GoogleGenAI({
      apiKey: apiKey || '',
    });
  }

  /**
   * Generate AI response based on conversation history
   */
  async generateResponse(
    conversationHistory: ChatMessage[],
    options?: AIGenerateOptions,
  ): Promise<string> {
    try {
      this.logger.log(`🤖 Generating AI response...`);
      this.logger.debug(`   Messages in context: ${conversationHistory.length}`);

      // Format conversation history
      const conversationText = this.formatHistoryForPrompt(conversationHistory);
      
      // Build the full prompt with system instructions
      const systemPrompt = options?.systemPrompt || this.getDefaultSystemPrompt();
      const fullPrompt = `${systemPrompt}

---

Conversation history:
${conversationText}

Please respond to the last message from the user in Bahasa Indonesia.`;

      this.logger.debug(`   Prompt length: ${fullPrompt.length} chars`);

      // Configure Google Search grounding
      const groundingTool = {
        googleSearch: {},
      };

      const config = {
        tools: [groundingTool],
      };

      // Generate response with grounding
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: fullPrompt,
        config,
      });

      const text = response.text || '';

      // Log grounding metadata if available
      if (response.candidates?.[0]?.groundingMetadata) {
        const metadata = response.candidates[0].groundingMetadata;
        this.logger.debug(`   🔍 Grounding used:`);
        this.logger.debug(`      - Search queries: ${metadata.webSearchQueries?.join(', ')}`);
        this.logger.debug(`      - Sources: ${metadata.groundingChunks?.length || 0}`);
        
        this.logger.log(`✅ AI response generated with grounding (${text.length} chars)`);
        this.logger.debug(`   Response: ${text.substring(0, 100)}...`);
        
        return text;
      }

      this.logger.log(`✅ AI response generated from knowledge (${text.length} chars)`);
      this.logger.debug(`   Response: ${text.substring(0, 100)}...`);

      return text;
    } catch (error) {
      this.logger.error('❌ Failed to generate AI response:', error.stack);
      throw error;
    }
  }

  /**
   * Format chat history for prompt
   */
  private formatHistoryForPrompt(history: ChatMessage[]): string {
    return history
      .map((msg) => {
        const role = msg.fromMe ? 'Assistant' : 'Customer';
        return `${role}: ${msg.body || '(no text)'}`;
      })
      .join('\n');
  }

  /**
   * Get default system prompt for the AI agent
   */
  private getDefaultSystemPrompt(): string {
    return `Peran: Kamu adalah CS PALAPA, layanan inspeksi mobil bekas profesional di Indonesia.

INFORMASI LAYANAN:

Cakupan Inspeksi:
• Mekanis: mesin, aki, oli, sistem rem
• Struktural: kaki-kaki, cek bekas tabrak/banjir
• Eksterior & Interior: cat, bodi, jok, dasbor
• Diagnostik: scan kelistrikan, cek odometer asli atau tidak
• Dokumen: verifikasi kelengkapan surat

Harga:
• LCGC: 300rb
• Regular: 350rb
• Extra: 400rb
• Luxury: 450rb
• Euro Small: 400rb
• Euro Medium: 450rb
• Euro High: 500rb
• Hybrid: 500rb
• EV: 600rb

Hasil: Laporan PDF lengkap + rekomendasi perbaikan + estimasi biaya

---

GAYA KOMUNIKASI:
❌ JANGAN seperti bot: panjang lebar, terlalu formal, kasih semua info sekaligus
❌ JANGAN terlalu ramah: "Hai!", "kok", tanya balik "ada yang bisa dibantu?"
✅ HARUS seperti manusia: profesional tapi santai, to the point

PRINSIP:
1. JAWAB SEPERLUNYA - cukup jawab yang ditanya, jangan overwhelm
2. PROFESIONAL SANTAI - sopan tapi natural, bukan terlalu excited atau terlalu kaku
3. BERTAHAP - info detail kasih kalau diminta, jangan langsung semua
4. SINGKAT - 2-3 kalimat cukup untuk pertanyaan sederhana
5. JANGAN TANYA BALIK - langsung jawab, stop di situ. Jangan "ada yang mau ditanyakan lagi?" atau "mau tau lebih lanjut?"

CONTOH RESPONS:

❌ SALAH (terlalu panjang):
"Halo! Terima kasih sudah bertanya. Kami menawarkan inspeksi komprehensif yang mencakup: 1. Mekanis seperti mesin, aki... 2. Struktural... 3. Eksterior... [dan seterusnya panjang sekali]"

❌ SALAH (terlalu ramah):
"Hai! Iya, kita cek lengkap kok, dari mesin sampai kaki-kaki mobil. Mau tau bagian mana lagi yang kita cek?"

✅ BENAR (profesional santai):
"Kita cek mesin, kaki-kaki, body, kelistrikan, sama kelengkapan dokumen."

---

FLOW PERCAKAPAN:

Pertanyaan umum → jawab ringkas + tanya follow-up
Tanya mobil spesifik → USE GOOGLE SEARCH untuk cari info harga/masalah umum
Tanya harga → kasih harga sesuai kategori
Mau booking → tanya: nama, mobil apa, tahun, lokasinya dimana

WAJIB pakai Google Search untuk:
- Harga pasaran mobil bekas yang ditanya
- Masalah umum atau recall model tertentu
- Review/perbandingan mobil
- Info otomotif terkini

---

ATURAN PENTING:
• Jangan janji pasti kondisi mobil tanpa inspeksi fisik
• Netral, jangan jelek-jelekin kompetitor
• Jangan rekomendasiin mobil tertentu
• Akhiri dengan disclaimer HANYA jika customer udah mau booking/serius: "Disclaimer: observasi non-bongkar; kepastian perlu cek langsung."

Inget: ngobrol natural, jangan kayak bot!`;
  }

  /**
   * Add inline citations to AI response based on grounding metadata
   * For WhatsApp, we just use simple [1] [2] markers without URLs
   */
  private addCitations(response: any): string {
    let text = response.text || '';
    const supports = response.candidates?.[0]?.groundingMetadata?.groundingSupports;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (!supports || !chunks) {
      return text;
    }

    // Sort supports by end_index in descending order to avoid shifting issues when inserting
    const sortedSupports = [...supports].sort(
      (a: any, b: any) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
    );

    for (const support of sortedSupports) {
      const endIndex = support.segment?.endIndex;
      if (endIndex === undefined || !support.groundingChunkIndices?.length) {
        continue;
      }

      // Use simple [1] [2] [3] markers instead of full URLs
      const citationNumbers = support.groundingChunkIndices
        .map((i: number) => `[${i + 1}]`)
        .join(' ');

      if (citationNumbers) {
        const citationString = ` ${citationNumbers}`;
        text = text.slice(0, endIndex) + citationString + text.slice(endIndex);
      }
    }

    return text;
  }

  /**
   * Generate response with custom system prompt
   */
  async generateWithCustomPrompt(
    conversationHistory: ChatMessage[],
    systemPrompt: string,
    options?: Omit<AIGenerateOptions, 'systemPrompt'>,
  ): Promise<string> {
    return this.generateResponse(conversationHistory, {
      ...options,
      systemPrompt,
    });
  }

  /**
   * Test AI connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      this.logger.log('🔍 Testing Google AI connection...');

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: 'Hello, this is a test. Please respond with "OK".',
      });

      const text = response.text || '';

      this.logger.log(`✅ Google AI connection successful`);
      this.logger.debug(`   Test response: ${text.substring(0, 50)}...`);

      return true;
    } catch (error) {
      this.logger.error('❌ Google AI connection failed:', error.message);
      return false;
    }
  }
}
