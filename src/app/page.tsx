import { VerificationFlow } from "@/components/VerificationFlow/VerificationFlow";
import { VerifiedCousins } from "@/components/VerifiedCousins/VerifiedCousins";
import {
  Flex,
  Section,
  Separator,
  Heading,
  Text,
  Container,
} from "@radix-ui/themes";
import styles from "./page.module.css";

interface VerifiedCousin {
  xUsername: string;
  xHandle: string;
  profilePicture: string;
}

interface VerifiedCousinsResponse {
  verifiedCousins: VerifiedCousin[];
}

const fetchVerifiedCousins = async (): Promise<VerifiedCousinsResponse> => {
  const response = await fetch(
    `${process.env.NEXTAUTH_URL}/api/verifiedCousins`,
    {
      cache: "no-store",
    },
  );
  const data = await response.json() as VerifiedCousinsResponse;
  return data;
};

const Page = async () => {
  const { verifiedCousins } = await fetchVerifiedCousins();
  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Hero Section */}
      <Section size="3" className={styles.heroSection}>
        <div className={styles.heroOverlay} />
        <Container size="2">
          <Flex
            direction="column"
            gap="4"
            align="center"
            style={{ textAlign: "center" }}
          >
            <Heading size="8" className={styles.animatedTitle}>
              Retardio Cousin NFT Verification
            </Heading>
            <Text size="5" className={styles.animatedSubtitle}>
              Verify your NFT ownership and connect with other verified cousins
              on X
            </Text>
          </Flex>
        </Container>
      </Section>

      {/* Main Content */}
      <Container size="2" style={{ padding: "4rem 0" }}>
        <Flex direction="column" gap="6">
          <Section size="1">
            <Flex direction="column" gap="4">
              <VerifiedCousins verifiedCousins={verifiedCousins} />
            </Flex>
          </Section>

          <Separator size="4" />

          <Section size="1">
            <Flex direction="column" gap="4">
              <Heading size="6" align="center">
                Get Verified
              </Heading>
              <VerificationFlow />
            </Flex>
          </Section>
        </Flex>
      </Container>
    </main>
  );
};

export default Page;
