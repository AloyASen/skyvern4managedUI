/* eslint-disable react-refresh/only-export-components */
import { Navigate, Outlet, createBrowserRouter, useLocation } from "react-router-dom";
import { BrowserSession } from "@/routes/browserSession/BrowserSession";
import { PageLayout } from "./components/PageLayout";
import { DiscoverPage } from "./routes/discover/DiscoverPage";
import { HistoryPage } from "./routes/history/HistoryPage";
import { RootLayout } from "./routes/root/RootLayout";
import { Settings } from "./routes/settings/Settings";
import { CreateNewTaskFormPage } from "./routes/tasks/create/CreateNewTaskFormPage";
import { RetryTask } from "./routes/tasks/create/retry/RetryTask";
import { StepArtifactsLayout } from "./routes/tasks/detail/StepArtifactsLayout";
import { TaskActions } from "./routes/tasks/detail/TaskActions";
import { TaskDetails } from "./routes/tasks/detail/TaskDetails";
import { TaskParameters } from "./routes/tasks/detail/TaskParameters";
import { TaskRecording } from "./routes/tasks/detail/TaskRecording";
import { TasksPage } from "./routes/tasks/list/TasksPage";
import { WorkflowPage } from "./routes/workflows/WorkflowPage";
import { WorkflowRun } from "./routes/workflows/WorkflowRun";
import { WorkflowRunParameters } from "./routes/workflows/WorkflowRunParameters";
import { Workflows } from "./routes/workflows/Workflows";
import { WorkflowsPageLayout } from "./routes/workflows/WorkflowsPageLayout";
import { WorkflowDebugger } from "./routes/workflows/editor/WorkflowDebugger";
import { WorkflowEditor } from "./routes/workflows/editor/WorkflowEditor";
import { WorkflowPostRunParameters } from "./routes/workflows/workflowRun/WorkflowPostRunParameters";
import { WorkflowRunOutput } from "./routes/workflows/workflowRun/WorkflowRunOutput";
import { WorkflowRunOverview } from "./routes/workflows/workflowRun/WorkflowRunOverview";
import { WorkflowRunRecording } from "./routes/workflows/workflowRun/WorkflowRunRecording";
import { DebugStoreProvider } from "@/store/DebugStoreContext";
// Removed standalone login/register pages; handled via landing modals
import { LandingPage } from "./routes/landing/LandingPage";
import { useAuthStore } from "@/store/AuthStore";
import { CredentialsPage } from "./routes/credentials/CredentialsPage";

const ProtectedRoot = () => {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/" />;
  }
  return (
    <DebugStoreProvider>
      <RootLayout />
    </DebugStoreProvider>
  );
};

const LegacyRedirect = ({ base }: { base: string }) => {
  const location = useLocation();
  const suffix = location.pathname.slice(base.length);
  const search = location.search || "";
  return <Navigate to={`/dashboard${base}${suffix}${search}`} replace />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  // Redirect legacy top-level routes to /dashboard/* equivalents
  {
    path: "/discover",
    element: <Navigate to="/dashboard/discover" />,
  },
  {
    path: "/discover/*",
    element: <LegacyRedirect base="/discover" />,
  },
  {
    path: "/workflows",
    element: <Navigate to="/dashboard/workflows" />,
  },
  {
    path: "/workflows/*",
    element: <LegacyRedirect base="/workflows" />,
  },
  {
    path: "/history",
    element: <Navigate to="/dashboard/history" />,
  },
  {
    path: "/history/*",
    element: <LegacyRedirect base="/history" />,
  },
  {
    path: "/settings",
    element: <Navigate to="/dashboard/settings" />,
  },
  {
    path: "/settings/*",
    element: <LegacyRedirect base="/settings" />,
  },
  {
    path: "/tasks",
    element: <Navigate to="/dashboard/tasks" />,
  },
  {
    path: "/tasks/*",
    element: <LegacyRedirect base="/tasks" />,
  },
  {
    path: "browser-session/:browserSessionId",
    element: <BrowserSession />,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoot />,
    children: [
      {
        index: true,
        element: <Navigate to="discover" />,
      },
      {
        path: "tasks",
        element: <PageLayout />,
        children: [
          {
            index: true,
            element: <TasksPage />,
          },
          {
            path: "create",
            element: <Outlet />,
            children: [
              {
                path: ":template",
                element: <CreateNewTaskFormPage />,
              },
              {
                path: "retry/:taskId",
                element: <RetryTask />,
              },
            ],
          },
          {
            path: ":taskId",
            element: <TaskDetails />,
            children: [
              {
                index: true,
                element: <Navigate to="actions" />,
              },
              {
                path: "actions",
                element: <TaskActions />,
              },
              {
                path: "recording",
                element: <TaskRecording />,
              },
              {
                path: "parameters",
                element: <TaskParameters />,
              },
              {
                path: "diagnostics",
                element: <StepArtifactsLayout />,
              },
            ],
          },
        ],
      },
      {
        path: "workflows",
        element: <WorkflowsPageLayout />,
        children: [
          {
            index: true,
            element: <Workflows />,
          },
          {
            path: ":workflowPermanentId",
            element: <Outlet />,
            children: [
              {
                index: true,
                element: <Navigate to="runs" />,
              },
              {
                path: "debug",
                element: <WorkflowDebugger />,
              },
              {
                path: ":workflowRunId/:blockLabel/debug",
                element: <WorkflowDebugger />,
              },
              {
                path: "edit",
                element: <WorkflowEditor />,
              },
              {
                path: "run",
                element: <WorkflowRunParameters />,
              },
              {
                path: "runs",
                element: <WorkflowPage />,
              },
              {
                path: ":workflowRunId",
                element: <WorkflowRun />,
                children: [
                  {
                    index: true,
                    element: <Navigate to="overview" />,
                  },
                  {
                    path: "blocks",
                    element: <Navigate to="overview" />,
                  },
                  {
                    path: "overview",
                    element: <WorkflowRunOverview />,
                  },
                  {
                    path: "output",
                    element: <WorkflowRunOutput />,
                  },
                  {
                    path: "parameters",
                    element: <WorkflowPostRunParameters />,
                  },

                  {
                    path: "recording",
                    element: <WorkflowRunRecording />,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "discover",
        element: <PageLayout />,
        children: [
          {
            index: true,
            element: <DiscoverPage />,
          },
        ],
      },
      {
        path: "history",
        element: <PageLayout />,
        children: [
          {
            index: true,
            element: <HistoryPage />,
          },
        ],
      },
      {
        path: "credentials",
        element: <PageLayout />,
        children: [
          {
            index: true,
            element: <CredentialsPage />,
          },
        ],
      },
      {
        path: "settings",
        element: <PageLayout />,
        children: [
          {
            index: true,
            element: <Settings />,
          },
        ],
      },
    ],
  },
]);

export { router };
