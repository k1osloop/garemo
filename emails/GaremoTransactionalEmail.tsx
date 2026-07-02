import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

type Props = {
  actionLabel?: string;
  actionUrl?: string;
  eyebrow: string;
  message: string;
  preview: string;
  title: string;
};

const colors = {
  accent: "#F2B227",
  background: "#FFF4E2",
  brand: "#1BA463",
  ink: "#0B1F3D",
  white: "#ffffff",
};

export function GaremoTransactionalEmail({
  actionLabel = "Abrir Garemo",
  actionUrl = "https://www.garemo.online",
  eyebrow,
  message,
  preview,
  title,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.background,
          color: colors.ink,
          fontFamily:
            'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          margin: 0,
          padding: "32px 12px",
        }}
      >
        <Container
          style={{
            backgroundColor: colors.white,
            border: "1px solid rgba(11,31,61,0.08)",
            borderRadius: 24,
            boxShadow: "0 18px 40px rgba(11,31,61,0.08)",
            margin: "0 auto",
            maxWidth: 560,
            overflow: "hidden",
          }}
        >
          <Section
            style={{
              backgroundColor: colors.ink,
              padding: "24px 28px",
            }}
          >
            <Text
              style={{
                color: colors.accent,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1,
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              Garemo
            </Text>
            <Text
              style={{
                color: colors.white,
                fontSize: 14,
                fontWeight: 600,
                margin: "6px 0 0",
              }}
            >
              Compra talento universitario
            </Text>
          </Section>

          <Section style={{ padding: "28px" }}>
            <Text
              style={{
                color: colors.brand,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 0.8,
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              {eyebrow}
            </Text>
            <Heading
              style={{
                color: colors.ink,
                fontSize: 28,
                lineHeight: "34px",
                margin: "8px 0 14px",
              }}
            >
              {title}
            </Heading>
            <Text
              style={{
                color: "rgba(11,31,61,0.76)",
                fontSize: 16,
                lineHeight: "26px",
                margin: "0 0 24px",
              }}
            >
              {message}
            </Text>
            <Button
              href={actionUrl}
              style={{
                backgroundColor: colors.brand,
                borderRadius: 14,
                color: colors.white,
                display: "inline-block",
                fontSize: 14,
                fontWeight: 800,
                padding: "13px 18px",
                textDecoration: "none",
              }}
            >
              {actionLabel}
            </Button>
            <Hr
              style={{
                borderColor: "rgba(11,31,61,0.1)",
                margin: "28px 0 18px",
              }}
            />
            <Text
              style={{
                color: "rgba(11,31,61,0.55)",
                fontSize: 12,
                lineHeight: "20px",
                margin: 0,
              }}
            >
              Este correo es transaccional. Si no reconoces esta actividad,
              entra a Garemo y revisa tu cuenta.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
