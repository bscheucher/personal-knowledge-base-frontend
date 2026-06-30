import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.tsx";
import LibraryPage from "./pages/LibraryPage.tsx";
import UploadPage from "./pages/UploadPage.tsx";
import ChatPage from "./pages/ChatPage.tsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Route>
    </Routes>
  );
}
