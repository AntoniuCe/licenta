package services

import (
	"fmt"
	"net/smtp"
	"os"
	"strings"
)

type OrderItem struct {
	ProductID uint
	Quantity  int
	Price     float64
}

type PaymentConfirmationData struct {
	ToEmail    string
	OrderID    uint
	Total      float64
	Items      []OrderItem
}

func SendPaymentConfirmation(data PaymentConfirmationData) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	fromEmail := os.Getenv("SMTP_FROM")

	if smtpHost == "" || smtpUser == "" || smtpPass == "" {
		// Email not configured — skip silently (don't fail the payment)
		return nil
	}

	if smtpPort == "" {
		smtpPort = "587"
	}
	if fromEmail == "" {
		fromEmail = smtpUser
	}

	subject := fmt.Sprintf("Confirmare plată – Comanda #%d", data.OrderID)
	body := buildEmailBody(data)

	msg := "MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"From: " + fromEmail + "\r\n" +
		"To: " + data.ToEmail + "\r\n" +
		"Subject: " + subject + "\r\n\r\n" +
		body

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	addr := smtpHost + ":" + smtpPort

	return smtp.SendMail(addr, auth, fromEmail, []string{data.ToEmail}, []byte(msg))
}

func buildEmailBody(data PaymentConfirmationData) string {
	var itemRows strings.Builder
	for _, item := range data.Items {
		itemRows.WriteString(fmt.Sprintf(`
			<tr>
				<td style="padding:10px 16px;border-bottom:1px solid #1e293b;color:#cbd5e1;">Produs #%d</td>
				<td style="padding:10px 16px;border-bottom:1px solid #1e293b;color:#cbd5e1;text-align:center;">%d</td>
				<td style="padding:10px 16px;border-bottom:1px solid #1e293b;color:#cbd5e1;text-align:right;">%.2f RON</td>
			</tr>`, item.ProductID, item.Quantity, item.Price*float64(item.Quantity)))
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080d16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#080d16;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f,#0f2147);border-radius:20px 20px 0 0;padding:36px 40px;text-align:center;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;background:rgba(37,99,235,0.2);border-radius:14px;margin-bottom:16px;">
            <span style="font-size:24px;">🛍️</span>
          </div>
          <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Plată confirmată!</h1>
          <p style="margin:10px 0 0;color:#94a3b8;font-size:15px;">Comanda ta a fost procesată cu succes.</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#0f172a;padding:32px 40px;">

          <!-- Order info -->
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:14px;margin-bottom:24px;overflow:hidden;">
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #334155;">
                <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Număr comandă</span>
                <div style="color:#ffffff;font-size:18px;font-weight:700;margin-top:4px;">#%d</div>
              </td>
              <td style="padding:16px 20px;border-bottom:1px solid #334155;text-align:right;">
                <span style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;">Total plătit</span>
                <div style="color:#ffffff;font-size:18px;font-weight:700;margin-top:4px;">%.2f RON</div>
              </td>
            </tr>
            <tr><td colspan="2" style="padding:14px 20px;">
              <span style="display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);color:#34d399;font-size:13px;font-weight:600;padding:6px 12px;border-radius:8px;">
                ✓ Plată procesată · Card
              </span>
            </td></tr>
          </table>

          <!-- Items table -->
          <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 12px;">Produse comandate</p>
          <table width="100%%" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:14px;overflow:hidden;">
            <thead>
              <tr style="background:#334155;">
                <th style="padding:10px 16px;color:#94a3b8;font-size:12px;font-weight:600;text-align:left;text-transform:uppercase;letter-spacing:0.08em;">Produs</th>
                <th style="padding:10px 16px;color:#94a3b8;font-size:12px;font-weight:600;text-align:center;text-transform:uppercase;letter-spacing:0.08em;">Cant.</th>
                <th style="padding:10px 16px;color:#94a3b8;font-size:12px;font-weight:600;text-align:right;text-transform:uppercase;letter-spacing:0.08em;">Subtotal</th>
              </tr>
            </thead>
            <tbody>%s</tbody>
            <tfoot>
              <tr style="background:#334155;">
                <td colspan="2" style="padding:12px 16px;color:#94a3b8;font-weight:600;font-size:14px;">Total</td>
                <td style="padding:12px 16px;color:#ffffff;font-weight:800;font-size:16px;text-align:right;">%.2f RON</td>
              </tr>
            </tfoot>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0a1628;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;border-top:1px solid #1e293b;">
          <p style="margin:0;color:#475569;font-size:13px;">Mulțumim pentru comanda ta!</p>
          <p style="margin:8px 0 0;color:#334155;font-size:12px;">K3s Demo Store · Go + Gin + PostgreSQL</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`, data.OrderID, data.Total, itemRows.String(), data.Total)
}
