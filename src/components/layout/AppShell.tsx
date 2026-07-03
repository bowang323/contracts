import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { LocalDocumentList } from "@/components/contracts/LocalDocumentList";
import { CreateDocumentDialog } from "@/components/documents/CreateDocumentDialog";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { SidebarHideButton } from "@/components/layout/SidebarHideButton";
import { AppIcon } from "@/components/layout/AppIcon";
import { MeshBackground } from "@/components/layout/MeshBackground";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateDocument,
} from "@/hooks/useCreateDocument";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  loadLocalDocuments,
  mergeDocumentMetadata,
  removeLocalDocument,
  sortLocalDocuments,
  type LocalDocumentCredential,
  type SortDirection,
  type SortField,
} from "@/lib/local-documents";
import { useLanguage } from "@/providers/LanguageProvider";

export function AppShell() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [sidebarOpen, setSidebarOpen] = useState(() => !isHome);
  const { createDocument, isCreating } = useCreateDocument();
  const [search, setSearch] = useState("");
  const [credentials, setCredentials] = useState<LocalDocumentCredential[]>(() =>
    loadLocalDocuments(),
  );
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const metadata = useQuery(
    api.contracts.refreshMetadata,
    credentials.length === 0
      ? "skip"
      : {
          documents: credentials.map((d) => ({
            documentId: d.documentId,
            password: d.password,
          })),
        },
  );

  const docs = useMemo(
    () => mergeDocumentMetadata(credentials, metadata),
    [credentials, metadata],
  );

  useEffect(() => {
    if (isHome) {
      setSidebarOpen(false);
    }
  }, [isHome]);

  useEffect(() => {
    const reload = () => setCredentials(loadLocalDocuments());
    window.addEventListener("contracts-local-docs-changed", reload);
    return () => window.removeEventListener("contracts-local-docs-changed", reload);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? docs.filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            d.documentId.toLowerCase().includes(q),
        )
      : docs;
    return sortLocalDocuments(base, sortField, sortDirection);
  }, [docs, search, sortDirection, sortField]);

  const sortOptions = useMemo(
    () => [
      { value: "updatedAt:desc", label: t("sortModifiedNewest") },
      { value: "updatedAt:asc", label: t("sortModifiedOldest") },
      { value: "createdAt:desc", label: t("sortCreatedNewest") },
      { value: "createdAt:asc", label: t("sortCreatedOldest") },
      { value: "name:asc", label: t("sortNameAsc") },
      { value: "name:desc", label: t("sortNameDesc") },
    ],
    [t],
  );

  const sortValue = `${sortField}:${sortDirection}`;

  const handleCreate = async (title: string) => {
    const created = await createDocument(title);
    if (created) {
      setCredentials(loadLocalDocuments());
      setShowCreateDialog(false);
      void navigate(`/d/${created.documentId}`);
    }
  };

  const handleRemoveLocal = (documentId: string) => {
    removeLocalDocument(documentId);
    setCredentials(loadLocalDocuments());
    if (location.pathname === `/d/${documentId}`) {
      void navigate("/");
    }
    toast.success(t("removedFromDevice"));
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <MeshBackground />
      <div className="dark relative flex h-svh min-h-0 w-full overflow-hidden">
        <Sidebar
          variant="floating"
          className="border-none bg-transparent p-3 [&_[data-sidebar=sidebar]]:rounded-none [&_[data-sidebar=sidebar]]:bg-transparent [&_[data-sidebar=sidebar]]:shadow-none [&_[data-sidebar=sidebar]]:ring-0"
        >
          <SidebarRail />
          <GlassPanel variant="sidebar" className="flex h-full min-h-0 flex-col p-3">
            <SidebarHeader className="gap-3 p-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <AppIcon />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">
                      {t("appTagline")}
                    </p>
                    <h1 className="text-lg font-semibold text-foreground">
                      {t("appTitle")}
                    </h1>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <LanguageToggle />
                  <SidebarTrigger className="md:hidden" />
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="bg-white/10 pl-8"
                />
              </div>
              <Select
                value={sortValue}
                items={sortOptions}
                onValueChange={(value) => {
                  if (!value) return;
                  const [field, direction] = value.split(":");
                  setSortField(field as SortField);
                  setSortDirection(direction as SortDirection);
                }}
              >
                <SelectTrigger className="w-full bg-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updatedAt:desc">
                    {t("sortModifiedNewest")}
                  </SelectItem>
                  <SelectItem value="updatedAt:asc">
                    {t("sortModifiedOldest")}
                  </SelectItem>
                  <SelectItem value="createdAt:desc">
                    {t("sortCreatedNewest")}
                  </SelectItem>
                  <SelectItem value="createdAt:asc">
                    {t("sortCreatedOldest")}
                  </SelectItem>
                  <SelectItem value="name:asc">{t("sortNameAsc")}</SelectItem>
                  <SelectItem value="name:desc">{t("sortNameDesc")}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {isCreating ? t("creating") : t("newDocument")}
              </Button>
            </SidebarHeader>
            <SidebarContent className="mt-4 min-h-0 flex-1 overflow-hidden p-0">
              <LocalDocumentList
                documents={filtered}
                onDelete={handleRemoveLocal}
              />
            </SidebarContent>
            <SidebarFooter className="p-0 pt-2">
              <SidebarHideButton />
            </SidebarFooter>
          </GlassPanel>
        </Sidebar>
        <SidebarInset className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-transparent">
          <Outlet />
        </SidebarInset>
      </div>

      <CreateDocumentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        isCreating={isCreating}
        onCreate={handleCreate}
      />
    </SidebarProvider>
  );
}
