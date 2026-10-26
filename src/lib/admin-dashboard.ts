type DashboardAccount = {
  roles: string[];
  permissions: string[];
};

type DashboardRequest = {
  id: string;
  requestNumber: number;
  subject: string;
  createdAt: string | Date;
  status: string;
  statusName: string;
  assignee: string | null;
};

type DashboardStatus = {
  code: string;
  isClosed: boolean;
};

export function adminDashboardAccess(account: DashboardAccount) {
  const can = (permission: string) => account.roles.includes("admin") || account.permissions.includes(permission);
  return {
    statistics: can("statistics.view"),
    requests: can("requests.manage"),
  };
}

export function buildRequestDashboard(requests: DashboardRequest[], statuses: DashboardStatus[]) {
  const closedStatuses = new Set(statuses.filter((status) => status.isClosed).map((status) => status.code));
  const latest = [...requests]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5);
  const closed = requests.filter((request) => closedStatuses.has(request.status)).length;
  return {
    total: requests.length,
    open: requests.length - closed,
    closed,
    latest,
  };
}
