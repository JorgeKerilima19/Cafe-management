export function generateYapeUrl(
  phone: string,
  amount: number,
  name: string = ""
) {
  // Yape URI format: yape://send?to=PHONE&amount=AMOUNT&name=NAME
  const params = new URLSearchParams({
    to: phone,
    amount: amount.toString(),
    name: name || "Cafetería",
  });
  return `yape://send?${params.toString()}`;
}

// For QR code, we need a web URL (Yape app handles yape://)
export function generateYapeWebUrl(
  phone: string,
  amount: number,
  name: string = ""
) {
  // Yape web URL (opens in browser → redirects to app)
  return `https://yape.com.pe/send?to=${phone}&amount=${amount}&name=${encodeURIComponent(
    name || "Cafetería"
  )}`;
}
