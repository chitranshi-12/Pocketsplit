import { GoogleGenAI } from '@google/genai';
import { ExpenseCategory } from '../types';

export interface ParsedReceipt {
  merchant?: string;
  totalAmount?: number;
  date?: string;
  category?: ExpenseCategory;
  description?: string;
}

export async function scanReceiptWithGemini(base64ImageWithHeader: string): Promise<ParsedReceipt> {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('Gemini API key is not configured in environment variables.');
  }

  // Extract mime type and clean base64 string
  const match = base64ImageWithHeader.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image format. Please upload a PNG, JPG, or WebP image.');
  }

  const mimeType = match[1];
  const base64Data = match[2];

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert receipt parser. Analyze the receipt photo and extract:
1. "merchant": The store or restaurant name (e.g. "Starbucks", "Trader Joe's", "Uber", "Swiggy").
2. "totalAmount": The final total bill amount as a positive number (numbers only, e.g. 450.50).
3. "date": Date of receipt in YYYY-MM-DD format. If date is not visible, use today's date.
4. "category": Pick the best matching category from: "Food & Drink", "Groceries", "Transportation", "Rent & Housing", "Utilities", "Entertainment", "Shopping", "Travel & Flight", "Health", "General".
5. "description": A short 3-6 word summary (e.g. "Dinner with drinks", "Weekly pantry groceries").

Return strictly a valid JSON object matching these keys.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      {
        text: prompt,
      },
    ],
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '';
  try {
    const parsed = JSON.parse(text);
    return {
      merchant: parsed.merchant || 'Scanned Receipt',
      totalAmount: typeof parsed.totalAmount === 'number' ? parsed.totalAmount : parseFloat(parsed.totalAmount) || 0,
      date: parsed.date || new Date().toISOString().split('T')[0],
      category: parsed.category || 'Food & Drink',
      description: parsed.description || parsed.merchant || 'Receipt Expense',
    };
  } catch (err) {
    console.error('Failed to parse Gemini receipt response:', text, err);
    throw new Error('Could not parse receipt contents. Please verify the receipt image or enter details manually.');
  }
}
