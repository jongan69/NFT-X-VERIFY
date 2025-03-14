import {
  Card,
  Container,
  Flex,
  Heading,
  Text,
  Link,
  Badge,
  HoverCard,
  Avatar,
  Grid,
  Box,
} from "@radix-ui/themes";
import { FaXTwitter } from "react-icons/fa6";

interface VerifiedCousin {
  xUsername: string;
  xHandle: string;
  profilePicture: string;
}

interface VerifiedCousinsProps {
  verifiedCousins: VerifiedCousin[];
}

export const VerifiedCousins = ({ verifiedCousins }: VerifiedCousinsProps) => {
  return (
    <Container size="2">
      <Flex direction="column" gap="4" align="center">
        <Flex direction="column" gap="2" align="center">
          <Heading size="6" align="center">
            Verified Cousins
          </Heading>
          <Flex gap="2" align="center">
            <Badge size="2" color="blue">
              {verifiedCousins.length} Members
            </Badge>
            <Badge size="2" color="green">
              Active Community
            </Badge>
          </Flex>
        </Flex>

        {verifiedCousins.length === 0 ? (
          <Card size="2" style={{ width: "100%", maxWidth: "400px" }}>
            <Flex
              direction="column"
              gap="2"
              align="center"
              style={{ padding: "2rem" }}
            >
              <Text size="4" align="center" color="gray">
                Be the first to join!
              </Text>
              <Text size="2" align="center" color="gray">
                Connect your wallet and verify your NFT to become a verified
                cousin
              </Text>
            </Flex>
          </Card>
        ) : (
          <Grid
            columns={{ initial: "1", sm: "2", md: "3" }}
            gap="3"
            style={{ width: "100%" }}
          >
            {verifiedCousins.map((cousin, index) => (
              <HoverCard.Root key={index}>
                <HoverCard.Trigger>
                  <Card
                    size="2"
                    style={{
                      cursor: "pointer",
                      height: "100%",
                      transition: "transform 0.2s",
                    }}
                  >
                    <Flex gap="3" align="center">
                      <Avatar
                        size="3"
                        fallback={cousin?.xHandle?.toUpperCase()}
                        src={cousin.profilePicture ?? "./logo.png"}
                        color="blue"
                      />
                      <Flex direction="column" gap="1">
                        <Text size="3" weight="bold">
                          {cousin.xUsername}
                        </Text>
                        <Link
                          href={`https://twitter.com/${cousin.xHandle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <FaXTwitter size={14} />
                          <Text size="2" color="blue">
                            @{cousin.xHandle}
                          </Text>
                        </Link>
                      </Flex>
                    </Flex>
                  </Card>
                </HoverCard.Trigger>
                <HoverCard.Content>
                  <Flex direction="column" gap="2" style={{ maxWidth: 300 }}>
                    <Text size="2" weight="bold">
                      {cousin.xUsername}
                    </Text>
                    <Text size="2" color="gray">
                      Verified Cousin
                    </Text>
                    <Box style={{ marginTop: "8px" }}>
                      <Link
                        href={`https://twitter.com/${cousin.xHandle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <FaXTwitter size={14} />
                        <Text size="2" color="blue">
                          View on X
                        </Text>
                      </Link>
                    </Box>
                  </Flex>
                </HoverCard.Content>
              </HoverCard.Root>
            ))}
          </Grid>
        )}
      </Flex>
    </Container>
  );
};
