# RBAC 权限控制

RBAC（Role-Based Access Control）把权限分配给角色，再把角色分配给用户。前端可以据此隐藏菜单、按钮并阻止无意义的页面导航，但这些措施只能改善界面体验，不能构成安全边界。每个受保护的后端接口仍必须根据可信身份独立执行授权检查。

## 类型定义

将权限写成联合类型可以在编译期发现拼写错误；权限项很多时，也可以从常量或接口 schema 推导类型。

```ts
// types/rbac.ts
export type Permission =
  | "user:read"
  | "user:write"
  | "order:read"
  | "order:delete";

export type RoleName = "admin" | "editor" | "guest";

export interface Role {
  name: RoleName;
  permissions: Permission[];
}

export interface UserInfo {
  id: string;
  roles: RoleName[];
}
```

## Pinia 权限 Store

下面的 `roleMap` 用于演示角色与权限的关系。生产系统通常由后端保存权威映射，并向前端返回当前用户的角色和已解析权限；客户端不能通过自行修改映射获得真实接口权限。

```ts
// stores/auth.ts
import { defineStore } from "pinia";
import type {
  Permission,
  Role,
  RoleName,
  UserInfo,
} from "@/types/rbac";

const roleMap: Record<RoleName, Role> = {
  admin: {
    name: "admin",
    permissions: ["user:read", "user:write", "order:read", "order:delete"],
  },
  editor: {
    name: "editor",
    permissions: ["user:read", "order:read"],
  },
  guest: {
    name: "guest",
    permissions: ["order:read"],
  },
};

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as UserInfo | null,
  }),

  getters: {
    permissions(state): Permission[] {
      if (!state.user) return [];

      return [
        ...new Set(
          state.user.roles.flatMap(
            (role) => roleMap[role]?.permissions ?? [],
          ),
        ),
      ];
    },

    hasPermission(): (permission: Permission) => boolean {
      return (permission) => this.permissions.includes(permission);
    },

    hasRole:
      (state) =>
      (role: RoleName): boolean =>
        state.user?.roles.includes(role) ?? false,
  },

  actions: {
    setUser(user: UserInfo) {
      this.user = user;
    },
    logout() {
      this.user = null;
    },
  },
});
```

返回函数的 Pinia getter 可以接收参数，但这类带参数的结果本身不会像普通 getter 那样缓存。这里的权限集合很小；数据较大时可以预先构造 `Set`，或让后端直接返回去重后的权限数组。

## 路由元信息与守卫

先为 `RouteMeta` 补充类型：

```ts
// types/router.d.ts
import "vue-router";
import type { Permission, RoleName } from "./rbac";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    roles?: RoleName[];
    permissions?: Permission[];
  }
}

export {};
```

路由守卫运行前，应先完成会话恢复或获取当前用户信息。下面假设这一步已在应用启动阶段完成：

```ts
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("@/views/Home.vue"),
  },
  {
    path: "/admin",
    name: "admin",
    component: () => import("@/views/Admin.vue"),
    meta: { requiresAuth: true, roles: ["admin"] },
  },
  {
    path: "/orders",
    name: "orders",
    component: () => import("@/views/Orders.vue"),
    meta: {
      requiresAuth: true,
      permissions: ["order:read"],
    },
  },
  {
    path: "/403",
    name: "forbidden",
    component: () => import("@/views/Forbidden.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.user) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  const roles = to.meta.roles;
  if (roles?.length && !roles.some(auth.hasRole)) {
    return { name: "forbidden" };
  }

  const permissions = to.meta.permissions;
  if (
    permissions?.length &&
    !permissions.every(auth.hasPermission)
  ) {
    return { name: "forbidden" };
  }
});

export default router;
```

这里约定“多个角色满足任意一个，多个权限必须全部满足”。如果业务语义不同，应显式修改 `some` 或 `every`，不要让调用方猜测。

## 按钮与业务操作

优先使用 `v-if` 做声明式显隐：

```ts
// composables/usePermission.ts
import { useAuthStore } from "@/stores/auth";
import type { Permission, RoleName } from "@/types/rbac";

export function usePermission() {
  const auth = useAuthStore();

  return {
    can: (permission: Permission) => auth.hasPermission(permission),
    is: (role: RoleName) => auth.hasRole(role),
  };
}
```

```vue
<script setup lang="ts">
import { usePermission } from "@/composables/usePermission";

const { can } = usePermission();

async function deleteOrder() {
  if (!can("order:delete")) return;
  await orderApi.deleteCurrent();
}
</script>

<template>
  <button v-if="can('order:delete')" @click="deleteOrder">
    删除订单
  </button>
</template>
```

需要复用低层 DOM 行为时，可以让指令接收已经计算好的布尔值。函数式指令会在 `mounted` 和 `updated` 时执行：

```ts
// directives/permission.ts
import type { Directive } from "vue";

export const vPermission: Directive<HTMLElement, boolean> = (
  element,
  binding,
) => {
  element.hidden = !binding.value;
};
```

```ts
app.directive("permission", vPermission);
```

```vue
<button v-permission="can('user:write')">新建用户</button>
```

隐藏按钮不能阻止用户直接调用 API。路由、菜单、指令和组合式函数都属于前端展示与导航控制，最终授权结果必须由后端返回。

---

本篇把权限数据从登录恢复到界面控制串联起来。示例假设后端在当前用户接口中返回已解析的权限列表；角色与权限的权威关系仍保存在服务端。

## 定义数据结构

```ts
// types/rbac.ts
export type Permission =
  | "user:read"
  | "user:write"
  | "order:read"
  | "order:delete";

export type RoleName = "admin" | "editor" | "guest";

export interface UserInfo {
  id: string;
  roles: RoleName[];
  permissions: Permission[];
}
```

`Permission` 若只是 `string`，只能统一字段含义，不能阻止拼写错误。联合类型、常量推导或运行时 schema 才能进一步约束允许值。接口数据仍要做运行时校验，TypeScript 类型不会自动验证网络响应。

## 权限 Store

```ts
// stores/auth.ts
import { defineStore } from "pinia";
import type {
  Permission,
  RoleName,
  UserInfo,
} from "@/types/rbac";
import { accountApi } from "@/api/account";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as UserInfo | null,
    sessionChecked: false,
  }),

  getters: {
    permissionSet(state): ReadonlySet<Permission> {
      return new Set(state.user?.permissions ?? []);
    },

    hasPermission(): (permission: Permission) => boolean {
      return (permission) => this.permissionSet.has(permission);
    },

    hasRole:
      (state) =>
      (role: RoleName): boolean =>
        state.user?.roles.includes(role) ?? false,
  },

  actions: {
    async restoreSession() {
      if (this.sessionChecked) return;

      try {
        this.user = await accountApi.getCurrentUser();
      } catch {
        this.user = null;
      } finally {
        this.sessionChecked = true;
      }
    },

    logout() {
      this.user = null;
      this.sessionChecked = true;
    },
  },
});
```

`sessionChecked` 用来区分“尚未恢复会话”和“已经确认未登录”。仅检查本地是否存在 token 不能证明用户已认证：令牌可能过期、被撤销或被篡改，应用仍需向可信服务验证并取得当前用户。

## 路由守卫

```ts
// router/guard.ts
import router from "@/router";
import { useAuthStore } from "@/stores/auth";
import type { Permission, RoleName } from "@/types/rbac";

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.restoreSession();

  if (to.meta.requiresAuth && !auth.user) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
    };
  }

  const roles = to.meta.roles as RoleName[] | undefined;
  if (roles?.length && !roles.some(auth.hasRole)) {
    return { name: "forbidden" };
  }

  const permissions = to.meta.permissions as Permission[] | undefined;
  if (
    permissions?.length &&
    !permissions.every(auth.hasPermission)
  ) {
    return { name: "forbidden" };
  }
});
```

Vue Router 4 的守卫可以直接返回路由位置、`false` 或不返回值。第三个 `next` 参数仍受支持，但每条逻辑路径必须恰好调用一次，容易出错；新的代码通常更适合使用返回值。

`to.meta` 是匹配到的父子路由记录 `meta` 的非递归合并结果。应明确权限数组的组合语义：示例要求任一角色、全部权限，复杂策略可改成单独的授权函数。

## 自定义指令

如果只需声明式控制，`v-if` 通常更清晰。确实需要复用 DOM 行为时，指令可以接收布尔结果：

```ts
// directives/permission.ts
import type { Directive } from "vue";

export const vPermission: Directive<HTMLElement, boolean> = (
  element,
  binding,
) => {
  element.hidden = !binding.value;
};
```

函数式自定义指令会在元素挂载和父组件更新时执行。不要在 `mounted` 中直接 `remove()`：元素一旦移除，权限变化时不容易由同一指令恢复，而且指令内部读取 Store 也不一定会成为组件渲染依赖。

## 组合式函数

```ts
// composables/usePermission.ts
import { useAuthStore } from "@/stores/auth";
import type { Permission, RoleName } from "@/types/rbac";

export function usePermission() {
  const auth = useAuthStore();

  const can = (permission: Permission): boolean =>
    auth.hasPermission(permission);

  const is = (role: RoleName): boolean =>
    auth.hasRole(role);

  return { can, is };
}
```

这里返回布尔值函数即可。Pinia getter 本身依赖响应式状态；组件渲染时调用 `can()` 会建立依赖，权限变化后视图会重新计算。无需在每次调用时额外创建一个 `computed`。

## 组件中使用

```vue
<script setup lang="ts">
import { usePermission } from "@/composables/usePermission";

const { can, is } = usePermission();

async function removeOrder() {
  if (!can("order:delete")) return;
  await orderApi.removeSelected();
}
</script>

<template>
  <p v-if="is('admin')">管理员区域</p>

  <button
    v-if="can('order:delete')"
    @click="removeOrder"
  >
    删除订单
  </button>

  <button v-permission="can('user:write')">
    新建用户
  </button>
</template>
```

即使按钮不可见，事件处理函数仍可保留一次本地判断，避免界面状态变化时误触发。但真正的拒绝必须发生在后端；攻击者可以绕过前端代码直接发送请求。

## 整体流程

```text
应用启动或进入受保护路由
  ↓
恢复并验证会话，获取当前用户、角色和权限
  ↓
Store 保存可信接口返回的数据
  ↓
路由守卫控制导航
  ↓
组件、v-if 或指令控制界面展示
  ↓
请求到达后端，后端再次执行权威授权
```

Store、路由、指令与组合式函数是不同层次的前端消费方式，不是四道独立的安全防线。权限数据变更后还应考虑重新拉取、缓存失效以及已注册动态路由的清理。

---

## 路由守卫

导航守卫可以放行、取消或重定向一次导航。全局后置钩子 `afterEach` 在导航已经确认后运行，适合标题、埋点等操作，不能再阻止这次导航。

```ts
router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.restoreSession();

  if (to.meta.requiresAuth && !auth.user) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
    };
  }
});

router.afterEach((to) => {
  document.title =
    typeof to.meta.title === "string"
      ? to.meta.title
      : "默认标题";
});
```

路由独享守卫使用 `beforeEnter`：

```ts
const routes = [
  {
    path: "/admin",
    name: "admin",
    component: () => import("@/views/Admin.vue"),
    beforeEnter: () => {
      const auth = useAuthStore();
      if (!auth.hasRole("admin")) {
        return { name: "forbidden" };
      }
    },
  },
];
```

Options API 组件还可以使用组件内守卫：

```js
export default {
  beforeRouteEnter(to, from, next) {
    next((instance) => {
      instance.fetchData();
    });
  },

  beforeRouteUpdate(to) {
    this.fetchData(to.params.id);
  },

  beforeRouteLeave() {
    if (this.hasUnsavedChanges) {
      return false;
    }
  },
};
```

`beforeRouteEnter` 执行时组件实例尚未创建，只能通过传给 `next` 的回调在导航确认后访问实例。其余新代码通常可采用守卫返回值，避免 `next` 被遗漏或重复调用。

## 路径参数不等于运行时动态路由

`/users/:id` 中的 `:id` 是动态路径参数；路由记录在创建 Router 时已经存在，只是参数值不同：

```ts
const routes = [
  {
    path: "/users/:id",
    name: "user-detail",
    component: () => import("@/views/UserDetail.vue"),
  },
];

const route = useRoute();
console.log(route.params.id);
```

运行时动态路由则是应用启动后通过 `addRoute()` 和 `removeRoute()` 改变路由表：

```ts
const removeAdminRoute = router.addRoute({
  path: "/admin",
  name: "admin",
  component: () => import("@/views/Admin.vue"),
});

// addRoute 返回的函数可以移除刚注册的记录。
removeAdminRoute();

// 有名称的记录也可以按名称移除。
router.removeRoute("admin");
```

`addRoute()` 只注册记录。如果新记录会匹配当前地址，需要再次导航才能显示它；在导航守卫内添加时，应返回目标位置触发新的导航，并确保下一轮不会再次添加导致无限重定向。

## 完整动态路由方案

### 定义路由表

每个要按名称移除的动态路由都应提供唯一 `name`：

```ts
// router/routes.ts
import type { RouteRecordRaw } from "vue-router";

export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/Login.vue"),
    meta: { title: "登录", public: true, hidden: true },
  },
  {
    path: "/403",
    name: "forbidden",
    component: () => import("@/views/Forbidden.vue"),
    meta: { title: "无权限", public: true, hidden: true },
  },
  {
    path: "/",
    name: "home",
    component: () => import("@/views/Home.vue"),
    meta: { title: "首页", requiresAuth: true },
  },
];

export const permissionRoutes: RouteRecordRaw[] = [
  {
    path: "/admin",
    name: "admin",
    component: () => import("@/views/Admin.vue"),
    meta: { title: "管理", roles: ["admin"] },
  },
  {
    path: "/editor",
    name: "editor",
    component: () => import("@/views/Editor.vue"),
    meta: { title: "编辑", roles: ["admin", "editor"] },
  },
  {
    path: "/users",
    name: "users",
    component: () => import("@/views/Users.vue"),
    meta: { title: "用户", roles: ["admin", "editor", "viewer"] },
  },
];
```

### 递归过滤路由

只使用顶层 `filter()` 会遗漏嵌套路由。下面约定：没有 `roles` 的记录可访问；有多个角色时满足任意一个即可。

```ts
// utils/permission.ts
import type { RouteRecordRaw } from "vue-router";

function canAccess(
  route: RouteRecordRaw,
  userRoles: readonly string[],
): boolean {
  const required = route.meta?.roles as string[] | undefined;
  return !required?.length ||
    required.some((role) => userRoles.includes(role));
}

export function filterRoutesByRole(
  routes: readonly RouteRecordRaw[],
  userRoles: readonly string[],
): RouteRecordRaw[] {
  return routes.flatMap((route) => {
    if (!canAccess(route, userRoles)) return [];

    const children = route.children
      ? filterRoutesByRole(route.children, userRoles)
      : undefined;

    return [{
      ...route,
      ...(children ? { children } : {}),
    }];
  });
}
```

如果业务允许“父路由无权限但某个子路由有权限”，过滤策略需要先处理子级，再决定是否保留布局父级；这属于另一种明确的权限模型。

### Pinia Store 注册并清理路由

`router.addRoute()` 返回移除函数。退出登录或切换账号时调用这些函数，才能真正清除旧用户的动态路由。

```ts
// stores/permission.ts
import { defineStore } from "pinia";
import type { RouteRecordRaw } from "vue-router";
import router from "@/router";
import {
  constantRoutes,
  permissionRoutes,
} from "@/router/routes";
import { filterRoutesByRole } from "@/utils/permission";

let removeRouteCallbacks: Array<() => void> = [];

export const usePermissionStore = defineStore("permission", {
  state: () => ({
    accessRoutes: [] as RouteRecordRaw[],
    isRoutesLoaded: false,
  }),

  actions: {
    generateRoutes(userRoles: readonly string[]) {
      this.resetRoutes();

      const accessRoutes = filterRoutesByRole(
        permissionRoutes,
        userRoles,
      );

      removeRouteCallbacks = accessRoutes.map((route) =>
        router.addRoute(route),
      );

      this.accessRoutes = [...constantRoutes, ...accessRoutes];
      this.isRoutesLoaded = true;
    },

    resetRoutes() {
      removeRouteCallbacks.forEach((removeRoute) => removeRoute());
      removeRouteCallbacks = [];
      this.accessRoutes = [];
      this.isRoutesLoaded = false;
    },
  },
});
```

### 守卫入口

本地 token 只能表示“存在一个候选凭据”，不能证明会话有效。`restoreSession()` 或 `fetchUserInfo()` 应调用后端验证凭据，并返回可信的角色与权限。

```ts
// router/guard.ts
import router from "@/router";
import { useAuthStore } from "@/stores/auth";
import { usePermissionStore } from "@/stores/permission";

const publicRouteNames = new Set(["login", "forbidden"]);

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const permission = usePermissionStore();

  await auth.restoreSession();

  if (!auth.user) {
    permission.resetRoutes();

    if (publicRouteNames.has(String(to.name))) return;

    return {
      name: "login",
      query: { redirect: to.fullPath },
    };
  }

  if (to.name === "login") {
    return { name: "home" };
  }

  if (!permission.isRoutesLoaded) {
    permission.generateRoutes(auth.user.roles);

    // 新路由可能正好匹配当前地址，重新发起一次替换导航。
    return { path: to.fullPath, replace: true };
  }
});
```

若角色或权限刷新，应先 `resetRoutes()` 再生成新路由。登出动作也应同时清理认证状态和动态路由。

### 侧边栏菜单

```vue
<script setup lang="ts">
import { computed } from "vue";
import { usePermissionStore } from "@/stores/permission";

const permissionStore = usePermissionStore();

const menuRoutes = computed(() =>
  permissionStore.accessRoutes.filter(
    (route) => route.meta?.hidden !== true,
  ),
);
</script>

<template>
  <nav>
    <router-link
      v-for="route in menuRoutes"
      :key="String(route.name)"
      :to="{ name: route.name }"
    >
      {{ route.meta?.title }}
    </router-link>
  </nav>
</template>
```

## 流程图

```text
触发导航
  ↓
向后端恢复或验证会话
  ├─ 未认证 → 清理动态路由 → 登录页
  └─ 已认证
       ↓
     路由是否已按当前角色注册？
       ├─ 是 → 继续导航
       └─ 否
            ↓
          递归过滤权限路由
            ↓
          addRoute() 注册并保存移除函数
            ↓
          返回当前地址，重新匹配
            ↓
          用 accessRoutes 生成菜单
```

动态路由与菜单过滤只减少前端暴露的入口。用户仍能构造请求，因此后端必须对每个资源和操作执行真正的 RBAC 授权。
