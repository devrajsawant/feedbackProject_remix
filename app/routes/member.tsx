"use client";
import {
  Button,
  TextInput,
  Textarea,
  Select,
  Group,
  Paper,
  Table,
  Title,
  Divider,
  Box,
  Text,
} from "@mantine/core";
import { createItem, readItems } from "@directus/sdk";
import directus from "libs/directus_sdk";
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  useLoaderData,
  useFetcher,
} from "@remix-run/react";
import { userIdCookie } from "~/cookies";
import { ValidatedForm, validationError } from "remix-validated-form";
import { createFeedbackValidator } from "libs/validator";

const validator = createFeedbackValidator();

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const cookieHeader = request.headers.get("Cookie");
    const userId = await userIdCookie.parse(cookieHeader);

    const feedbacks = await directus.request(
      readItems("feedback", {
        filter: {
          created_by: { _eq: userId },
        },
      })
    );

    return { feedbacks };
  } catch (error) {
    console.error("Error loading feedbacks:", error);
    throw new Response("Failed to load feedbacks", { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const userId = await userIdCookie.parse(cookieHeader);
  const formData = await request.formData();

  const validation = await validator.validate(formData);
  if (validation.error) {
    return validationError(validation.error);
  }

  const { title, description, category } = validation.data;

  await directus.request(
    createItem("feedback", {
      title,
      description,
      category,
      created_by: userId,
      created_at: new Date().toISOString(),
    })
  );

  return redirect("/member");
}

export default function MemberDashboard() {
  const { feedbacks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <Paper radius="md" m={50} p={20} withBorder bg="white">
      <Title order={1} c="red">
        Submit Feedback
      </Title>

      <ValidatedForm
        method="post"
        validator={validator}
        fetcher={fetcher}
      >
        <TextInput
          label="Title"
          name="title"
          required
          mb="sm"
        />

        <Textarea
          label="Description"
          name="description"
          autosize
          minRows={3}
          required
          mb="sm"
        />

        <Select
          label="Category"
          name="category"
          data={["Bug", "Feature", "Other"]}
          required
          mb="sm"
        />

        <Group justify="flex-end">
          <Button
            type="submit"
            loading={fetcher.state === "submitting"}
          >
            Submit
          </Button>
        </Group>
      </ValidatedForm>

      <Divider color="dark.4" my="md" />

      <Title order={2}>All Feedbacks</Title>

      {feedbacks.length > 0 ? (
        <Table
          highlightOnHover
          striped
          withTableBorder
          verticalSpacing="sm"
        >
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Created at</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((fb: any) => (
              <tr key={fb.id} style={{ textAlign: "center" }}>
                <td>{fb.title}</td>
                <td>{fb.category}</td>
                <td>{fb.status}</td>
                <td>{new Date(fb.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Box ta="center">
          <Text>No feedbacks found.</Text>
        </Box>
      )}
    </Paper>
  );
}
