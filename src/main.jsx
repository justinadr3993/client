import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./services/store/index.js";
import Root from "./routes/root.jsx";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import theme from "./styles/theme.js";
import { Analytics } from "@vercel/analytics/react";
import "./styles/index.css";

const router = createBrowserRouter([{ path: "*", element: <Root /> }]);

// Render the application
ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Analytics />
      <RouterProvider router={router} />
    </ThemeProvider>
  </Provider>
);
