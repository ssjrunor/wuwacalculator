import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SEO_CONFIG from "../seoConfig";

export function useSEO() {
    const location = useLocation();
    const { pathname } = location;

    useEffect(() => {
        const config = SEO_CONFIG[pathname] || SEO_CONFIG["/"];
        document.title = config.title;

        let descTag = document.querySelector('meta[name="description"]');
        if (!descTag) {
            descTag = document.createElement("meta");
            descTag.name = "description";
            document.head.appendChild(descTag);
        }
        descTag.content = config.description;
    }, [pathname]);
}
