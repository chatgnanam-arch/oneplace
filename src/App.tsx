import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { AuthProvider } from "./features/auth/AuthProvider";
import { BookmarksProvider } from "./features/bookmarks/BookmarksProvider";
import { EncryptionProvider } from "./features/encryption/EncryptionProvider";
import { DiscoverPage } from "./pages/DiscoverPage";
import { MyLinksPage } from "./pages/MyLinksPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <EncryptionProvider>
          <BookmarksProvider>
            <AppShell>
              <Routes>
                <Route element={<DiscoverPage />} path="/" />
                <Route element={<MyLinksPage />} path="/my-links" />
                <Route element={<Navigate replace to="/" />} path="*" />
              </Routes>
            </AppShell>
          </BookmarksProvider>
        </EncryptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
