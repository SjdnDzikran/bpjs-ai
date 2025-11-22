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
  async generateResponseWithEscalation(
    conversationHistory: ChatMessage[],
    options?: AIGenerateOptions,
  ): Promise<{ text: string; escalate: boolean }> {
    const rawText = await this.generateResponse(conversationHistory, options);

    const escalate = this.shouldEscalate(rawText);
    const cleanText = this.stripEscalationMarker(rawText);

    this.logger.log(
      `🤖 Escalation check: escalate=${escalate ? 'YES' : 'NO'} (len=${cleanText.length})`,
    );

    return { text: cleanText, escalate };
  }

  /**
   * Deteksi apakah perlu eskalasi dari output model.
   */
  private shouldEscalate(text: string): boolean {
    if (!text) return false;

    // utama: cek tag eksplisit
    if (text.includes('[[ESCALATE_TO_HUMAN]]')) return true;

    // cadangan: pola kalimat "tidak tahu"
    const lower = text.toLowerCase();
    const patterns = [
      'saya tidak memiliki cukup informasi',
      'saya tidak dapat memberikan informasi yang pasti',
      'sebaiknya hubungi kantor bpjs',
      'silakan hubungi care center',
      'perlu dicek langsung di kantor bpjs',
      'sebaiknya ditangani langsung oleh petugas',
    ];

    return patterns.some((p) => lower.includes(p));
  }

  /**
   * Bersihin tag eskalasi supaya user tidak melihat token mentah.
   */
  private stripEscalationMarker(text: string): string {
    return text.replace('[[ESCALATE_TO_HUMAN]]', '').trim();
  }
  /**
   * Format chat history for prompt
   */
  private formatHistoryForPrompt(history: ChatMessage[]): string {
    return history
      .map((msg) => {
        const role = msg.fromMe ? 'Assistant' : 'Customer';

        // Not all ChatMessage fields are declared, so be a bit defensive
        const anyMsg = msg as any;
        const hasMedia: boolean | undefined = anyMsg.hasMedia;
        const mediaType: string | undefined = anyMsg.mediaType;

        const isVoice =
          !!hasMedia &&
          typeof mediaType === 'string' &&
          mediaType.startsWith('audio/');

        // You can label only voice, or both:
        // - voice: "Customer (voice): ..."
        // - text:  "Customer (text): ..."
        const sourceLabel = isVoice ? 'voice message' : 'text message';

        // Example: "Customer (voice message): halo tadi saya kirim voice note..."
        return `${role} (${sourceLabel}): ${msg.body || '(no text)'}`;
      })
      .join('\n');
  }


  /**
   * Get default system prompt for the AI agent
   */
  private getDefaultSystemPrompt(): string {
    return `PERAN Kamu adalah petugas layanan pelanggan BPJS Kesehatan di Indonesia.
GAYA KOMUNIKASI
❌ Jangan seperti bot: terlalu formal, terlalu panjang, kasih semua info sekaligus
❌ Jangan terlalu ramah: “hai!”, “kok”, “bisa dibantu?”
✅ Harus seperti manusia: profesional, santai, to the point
PRINSIP UTAMA
1.	Jawab seperlunya – cukup jawab yang ditanya, jangan melebar
2.	Profesional santai – sopan tapi natural
3.	Bertahap – detail diberikan kalau diminta
4.	Singkat – 2–3 kalimat cukup untuk pertanyaan sederhana
5.	Jangan tanya balik yang tidak perlu – kecuali saat data wajib dibutuhkan (misal NIK untuk cek status)

CAKUPAN INFO BPJS YANG BOLEH DIJELASKAN
Ringkas saja, misalnya:
•	Pendaftaran dan perubahan data peserta
•	Cek status kepesertaan
•	Iuran, denda, dan tunggakan
•	Faskes dan rujukan (Apabila lokasi kurang jelas atau detail minta untuk memberikan lokasi detail)
•	Klaim dan layanan di FKTP/FKRTL
•	JKN Mobile dan administrasi online
Jangan langsung jelasin panjang; tunggu ditanya lanjutannya.

FLOW PERCAKAPAN
Pertanyaan umum → jawab ringkas + tawari follow-up singkat yang relevan
Contoh:
“Cara pindah faskes gimana?” → “Lewat Mobile JKN, bagian Ubah Data Peserta. Biasanya proses 1×24 jam.”
Pertanyaan spesifik yang butuh data → minta NIK, nama, dan tanggal lahir
Contoh:
“Status BPJS saya masih aktif?” → “Boleh NIK, nama lengkap, dan tanggal lahirnya untuk dicek.”
Permintaan administrasi → jelasin langkah seperlunya
Masalah iuran/tunggakan → sebut angka kalau user kasih data
Keluhan pelayanan → tanggapi netral dan tenang

ATURAN PENTING
•	Jangan menyalahkan peserta atau faskes
•	Jangan janji hal yang di luar kewenangan (“pasti disetujui”, “nanti saya percepat”)
•	Netral, tidak membandingkan faskes
•	Semua jawaban berbasis prosedur resmi BPJS
•	Tidak memberi analisis medis, hanya prosedur layanan BPJS
•	Jangan memaksa user pakai aplikasi, cukup tawarkan seperlunya
CONTOH JAWABAN YANG BENAR
User: “Cara bayar iuran gimana?”
→ “Bisa lewat Mobile JKN, bank, dompet digital, atau minimarket. Nominalnya sesuai golongan peserta.”
User: “Pindah faskes bisa langsung hari ini?”
→ “Bisa asal belum pindah dalam 3 bulan terakhir. Prosesnya lewat Mobile JKN.”
DISKLAIMER
Hanya digunakan kalau peserta mau proses administrasi:
“Disclaimer: pengecekan berdasarkan data sistem. Untuk kepastian layanan medis mengikuti kebijakan faskes.
KEBIJAKAN ESKALASI KE PETUGAS MANUSIA
Jika pertanyaan:
• di luar cakupan informasi BPJS di atas,
• terlalu spesifik ke kasus individu yang butuh akses sistem internal,
• atau kamu TIDAK YAKIN dengan jawabannya,

MAKA:
1) Jawab singkat bahwa kasusnya perlu dicek petugas manusia.
2) Tambahkan TAG berikut PERSIS di akhir jawaban:

[[ESCALATE_TO_HUMAN]]

Jangan gunakan tag itu untuk pertanyaan biasa yang masih dapat kamu jawab dengan yakin.”
`;
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
    async transcribeAudio(
    audioBuffer: Buffer,
    mimeType = 'audio/ogg',
    options?: { translateTo?: string },
  ): Promise<string> {
    try {
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Audio buffer is empty');
      }

      const base64 = audioBuffer.toString('base64');

      const promptText = options?.translateTo
        ? `Transcribe this WhatsApp voice note and translate it to ${options.translateTo}. 
           Return only the translated text.`
        : `Transcribe this WhatsApp voice note. 
           Return only the spoken text, no extra explanation.`;

      const response = await this.ai.models.generateContent({
        model: this.modelName, // already set to "gemini-2.5-flash"
        contents: [
          {
            role: 'user',
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
      });

      const text = response.text || '';
      this.logger.debug(`transcribed : ${text}`);
      this.logger.debug(
        `📝 Audio transcription generated (${text.length} chars, mimeType=${mimeType})`,
      );

      return text;
    } catch (error) {
      this.logger.error('❌ Failed to transcribe audio with Google AI:', error);
      throw error;
    }
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
