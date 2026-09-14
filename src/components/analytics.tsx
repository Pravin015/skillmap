import Script from "next/script";

/**
 * PostHog browser snippet, loaded only when NEXT_PUBLIC_POSTHOG_KEY is set. Identifies the viewer by a hashed id
 * (passed from the server) so sessions and server events line up without exposing raw ids or emails.
 */
export function Analytics({ distinct, role }: { distinct?: string | null; role?: string | null }) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  const host = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, "");
  const identify = distinct ? `posthog.identify(${JSON.stringify(distinct)}, { role: ${JSON.stringify(role ?? "guest")} });` : "";
  return (
    <Script id="posthog" strategy="afterInteractive">{`
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister identify alias reset group set_config".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init(${JSON.stringify(key)}, { api_host: ${JSON.stringify(host)}, person_profiles: "identified_only", capture_pageview: true, autocapture: false, mask_all_text: true });
${identify}
`}</Script>
  );
}
