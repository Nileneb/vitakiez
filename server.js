import express from "express";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import nodemailer from "nodemailer";

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser for JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic security headers
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                "default-src": ["'self'"],
                "img-src": ["'self'", "data:"],
                "style-src": ["'self'", "'unsafe-inline'"],
                "script-src": ["'self'"]
            }
        },
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })
);

app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Static
app.use(express.static("public", { maxAge: "1h", etag: true }));

// Health endpoint
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Form submission endpoint
app.post("/api/submit-form", async (req, res) => {
    try {
        const { type, ...formData } = req.body;

        // Create email transporter (configure with your SMTP settings)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.strato.de",
            port: parseInt(process.env.SMTP_PORT) || 465,
            secure: true, // true for port 465 (SSL/TLS)
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Email content based on form type
        let subject, text;
        if (type === "bewohner") {
            subject = "Neue Wartelisten-Anfrage (Bewohner)";
            text = `
Neue Anfrage von potenziellem Bewohner:

Name: ${formData.name}
E-Mail: ${formData.email}
Telefon: ${formData.phone || "Nicht angegeben"}
Pflegegrad: ${formData.pflegegrad || "Nicht angegeben"}
Einzugstermin: ${formData.einzug || "Nicht angegeben"}

Nachricht:
${formData.nachricht || "Keine Nachricht"}
            `;
        } else {
            subject = "Neue Investoren-Anfrage";
            text = `
Neue Anfrage von potenziellem Investor:

Name/Firma: ${formData.name}
E-Mail: ${formData.email}
Telefon: ${formData.phone || "Nicht angegeben"}
Interesse: ${formData.interesse || "Nicht angegeben"}
Betrag: ${formData.betrag || "Nicht angegeben"}

Nachricht:
${formData.nachricht || "Keine Nachricht"}
            `;
        }

        // Send email
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: "info@vitakiez.de",
            subject,
            text
        });

        res.json({ success: true, message: "Anfrage erfolgreich versendet" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({
            success: false,
            message: "Fehler beim Versenden. Bitte versuchen Sie es später erneut."
        });
    }
});

// Fallback to index.html (SPA-style)
app.get("*", (_req, res) => {
    res.sendFile(process.cwd() + "/public/index.html");
});

app.listen(PORT, () => {
    console.log(`vitakiez listening on http://0.0.0.0:${PORT}`);
});
