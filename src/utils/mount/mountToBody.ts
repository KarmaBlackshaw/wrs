import { render } from "vue";
import type { AppContext, Component } from "vue";

export function mountToBody(component: Component, props: Record<string, unknown>, appContext?: AppContext) {
  const container = document.createElement("div");
  document.body.append(container);

  const vnode = h(component, props);
  vnode.appContext = appContext ?? null;
  render(vnode, container);

  return () => {
    render(null, container);
    container.remove();
  };
}
