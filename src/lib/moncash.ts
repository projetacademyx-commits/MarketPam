const SANDBOX_API = "https://sandbox.moncashbutton.digicelgroup.com/Api";
const PRODUCTION_API = "https://moncashbutton.digicelgroup.com/Api";
const SANDBOX_CHECKOUT = "https://sandbox.moncashbutton.digicelgroup.com/Moncash-middleware/Payment/Redirect";
const PRODUCTION_CHECKOUT = "https://moncashbutton.digicelgroup.com/Moncash-middleware/Payment/Redirect";

type MonCashPayment = {
  token?: string;
  message?: string;
  orderId?: string | number;
  amount?: string | number;
  transactionId?: string | number;
};

function getConfig() {
  const clientId = process.env.MONCASH_CLIENT_ID;
  const clientSecret = process.env.MONCASH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("MonCash n'est pas configuré sur le serveur.");
  }

  const production = process.env.MONCASH_MODE === "production";
  return {
    apiBase: production ? PRODUCTION_API : SANDBOX_API,
    checkoutBase: production ? PRODUCTION_CHECKOUT : SANDBOX_CHECKOUT,
    clientId,
    clientSecret,
  };
}

export function getMonCashAmount(usdCents: number) {
  const rate = Number(process.env.MONCASH_USD_TO_HTG_RATE);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Configurez MONCASH_USD_TO_HTG_RATE avec le taux USD/HTG de votre compte marchand.");
  }
  const amount = Math.round((usdCents / 100) * rate);
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new Error("Le montant calculé pour MonCash est invalide.");
  }
  return amount;
}

async function getAccessToken(apiBase: string, clientId: string, clientSecret: string) {
  const response = await fetch(`${apiBase}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as { access_token?: string };
  if (!response.ok || !data.access_token) {
    throw new Error("Authentification MonCash impossible. Vérifiez les identifiants et le mode configuré.");
  }
  return data.access_token;
}

export async function createMonCashPayment(orderId: string, amount: number) {
  const config = getConfig();
  const accessToken = await getAccessToken(config.apiBase, config.clientId, config.clientSecret);
  const response = await fetch(`${config.apiBase}/v1/CreatePayment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ amount, orderId: Number(orderId) }),
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as { payment?: MonCashPayment };
  const token = data.payment?.token;
  if (!response.ok || !token) {
    throw new Error("MonCash n'a pas pu créer la session de paiement.");
  }
  return `${config.checkoutBase}?token=${encodeURIComponent(token)}`;
}

export async function verifyMonCashPayment(orderId: string) {
  const config = getConfig();
  const accessToken = await getAccessToken(config.apiBase, config.clientId, config.clientSecret);
  const response = await fetch(
    `${config.apiBase}/v1/RetrieveOrderPayment?orderId=${encodeURIComponent(orderId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      cache: "no-store",
    },
  );
  const data = (await response.json().catch(() => ({}))) as { payment?: MonCashPayment };
  if (!response.ok || !data.payment) {
    throw new Error("Impossible de vérifier le paiement auprès de MonCash.");
  }
  return data.payment;
}