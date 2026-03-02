import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function KarmitisCallbackRoute() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        navigate(`/settings${location.search}${location.hash}`, { replace: true });
    }, [navigate, location.search, location.hash]);

    return null;
}
