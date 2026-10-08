import type { ComponentProps } from 'react';
/** Two document routes do not need a client router. Native anchors also work
 * before hydration and avoid the current Vinext navigation regression. */
export default function NavigationLink(props: ComponentProps<'a'>) { return <a {...props} />; }
