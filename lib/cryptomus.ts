import CryptoJS from 'crypto-js';

interface CryptomusPaymentData {
  amount: string;
  currency: string;
  order_id: string;
  network?: string;
  url_return?: string;
  url_callback?: string;
  is_payment_multiple?: boolean;
  lifetime?: number;
  to_currency?: string;
}

interface CryptomusPaymentResponse {
  state: number;
  result: {
    uuid: string;
    order_id: string;
    amount: string;
    payment_status: string;
    url: string;
    expired_at: number;
    address: string;
    txid?: string;
    currency: string;
    comments?: string;
  };
}

class CryptomusAPI {
  private apiKey: string;
  private merchantUuid: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.CRYPTOMUS_API_KEY!;
    this.merchantUuid = process.env.CRYPTOMUS_MERCHANT_UUID!;
    this.baseUrl = 'https://api.cryptomus.com/v1';
  }

  private generateSign(data: any): string {
    const jsonString = JSON.stringify(data);
    const base64Data = Buffer.from(jsonString).toString('base64');
    return CryptoJS.MD5(base64Data + this.apiKey).toString();
  }

  async createPayment(data: CryptomusPaymentData): Promise<CryptomusPaymentResponse> {
    const requestData = {
      ...data,
      merchant: this.merchantUuid,
    };

    const sign = this.generateSign(requestData);

    const response = await fetch(`${this.baseUrl}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': this.merchantUuid,
        'sign': sign,
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Cryptomus API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getPaymentInfo(uuid: string): Promise<any> {
    const data = {
      merchant: this.merchantUuid,
      uuid: uuid,
    };

    const sign = this.generateSign(data);

    const response = await fetch(`${this.baseUrl}/payment/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': this.merchantUuid,
        'sign': sign,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Cryptomus API error: ${response.statusText}`);
    }

    return response.json();
  }

  verifyWebhook(data: any, receivedSign: string): boolean {
    const calculatedSign = this.generateSign(data);
    return calculatedSign === receivedSign;
  }
}

export const cryptomus = new CryptomusAPI();