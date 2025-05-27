import {
  Box,
  Button,
  Center,
  Flex,
  Image,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { ValidatedForm, validationError } from "remix-validated-form";
import { useActionData } from "@remix-run/react";
import { withYup } from "@remix-validated-form/with-yup";
import * as yup from "yup";
import { redirect } from "@remix-run/node";
import directus from "libs/directus_sdk";
import { readMe, readRole } from "@directus/sdk";
import { userIdCookie } from "~/cookies";
import { useState } from "react";

// Schema
const loginSchema = yup.object({
  email: yup.string().email("Invalid email address").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

const validator = withYup(loginSchema);

type ActionData = {
  fieldErrors?: {
    email?: string;
    password?: string;
  };
  formError?: string;
};

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const validation = await validator.validate(formData);

  if (validation.error) {
    return validationError(validation.error);
  }

  const { email, password } = validation.data;

  try {
    const loginResponse = await directus.login(email, password);
    const accessToken = loginResponse.access_token;
    if (!accessToken) {
      throw new Error("Login failed: No access token received");
    }

    const user = await directus.request(readMe());
    const userId = user.id;
    const role = user.role;
    const setCookieHeader = await userIdCookie.serialize(userId);
    const result = await directus.request(readRole(role));

    if (result.name === "feedback_admin") {
      return redirect("/admin", {
        headers: { "Set-Cookie": setCookieHeader },
      });
    } else if (result.name === "feedback_members") {
      return redirect("/member", {
        headers: { "Set-Cookie": setCookieHeader },
      });
    } else {
      return redirect("/", { status: 303 });
    }
  } catch (error) {
    console.error("Login failed:", error);
    return {
      fieldErrors: {},
      formError: "Invalid email or password. Please try again.",
    };
  }
}

export default function LoginPage() {
  const actionData = useActionData<ActionData>();
  const [loading, setLoading] = useState(false);

  return (
    <Box h="100vh" p="md">
      <Center>
        <Flex w="70vw" h="90vh" justify="center" align="start" pt={30}>
          <Stack>
            <Paper w="55vw" h="50vh" radius={10} style={{ overflow: "hidden" }}>
              <Image
                src="https://placehold.co/600x400/EEE/31343C"
                alt="image"
                fit="cover"
                height={370}
              />
            </Paper>
            <Center w="55vw">
              This is a demo feedback portal. Kindly log in to proceed.
            </Center>
          </Stack>
        </Flex>

        <Paper radius="sm" px={50}>
          <Stack w="30vw">
            <Title order={1}>Provide Your Valuable Feedback</Title>

            {/* Display general form error */}
            {actionData?.formError && (
              <Text color="red" size="sm">
                {actionData.formError}
              </Text>
            )}

            <ValidatedForm
              method="post"
              validator={validator}
              onSubmit={() => setLoading(true)}
            >
              <TextInput
                label="Email"
                name="email"
                mb="md"
                placeholder="you@example.com"
                error={actionData?.fieldErrors?.email}
                
              />

              <PasswordInput
                label="Password"
                name="password"
                mb="xl"
                placeholder="Your password"
                error={actionData?.fieldErrors?.password}
                
              />

              <Button type="submit" fullWidth loading={loading}>
                Login
              </Button>
            </ValidatedForm>
          </Stack>
        </Paper>
      </Center>
    </Box>
  );
}
