import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useFetcher,
} from "@remix-run/react";
import {
  Button,
  Flex,
  Paper,
  Select,
  Table,
  TextInput,
  Textarea,
  Title,
  Group,
  Divider,
} from "@mantine/core";
import directus from "libs/directus_sdk";
import {
  createItem,
  deleteItem,
  readItems,
  updateItem,
} from "@directus/sdk";

export async function loader({}: LoaderFunctionArgs) {
  const feedbacks = await directus.request(readItems("feedback"));
  return { feedbacks };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;

    await directus.request(
      createItem("feedback", {
        title,
        description,
        category,
        status: "Pending",
      })
    );
    return redirect("/admin");
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    await directus.request(deleteItem("feedback", id));
  }

  if (intent === "update-status") {
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;
    await directus.request(updateItem("feedback", id, { status }));
    return redirect("/admin");
  }

  return null;
}

export default function AdminPage() {
  const { feedbacks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  return (
    <Paper radius="md" m={50} p={20} withBorder bg="white">
      

      <Title order={1} c="red">
        Submit Feedback
      </Title>

      <fetcher.Form method="post">
        <input type="hidden" name="intent" value="create" />
        <TextInput label="Title" name="title" required mb="sm" />
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
          <Button type="submit" loading={fetcher.state === "submitting" && fetcher.formData?.get("intent") === "create"}>
            Submit
          </Button>
        </Group>
      </fetcher.Form>

      <Divider color="dark.4" my="md" />

      <Title order={2}>All Feedbacks</Title>

      {feedbacks.length > 0 ? (
        <Table highlightOnHover striped withTableBorder verticalSpacing="sm">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((fb: any) => {
              return (
                <tr key={fb.id} style={{textAlign: 'center'}}>
                  <td>{fb.title}</td>
                  <td>{fb.category}</td>
                  <td>
                    <Form method="post">
                      <input type="hidden" name="intent" value="update-status" />
                      <input type="hidden" name="id" value={fb.id} />
                      <Select
                        name="status"
                        defaultValue={fb.status}
                        data={["Pending", "Reviewed"]}
                       
                      />
                    </Form>
                  </td>
                  <td>
                    <fetcher.Form method="post">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={fb.id} />
                      <Button
                        type="submit"
                        variant="light"
                        color="red"
                        loading={fetcher.state === "submitting" && fetcher.formData?.get("id") === fb.id}
                      >
                        Delete
                      </Button>
                    </fetcher.Form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <div style={{ textAlign: "center", color: "dimmed" }}>
          No feedbacks found.
        </div>
      )}
    </Paper>
  );
}