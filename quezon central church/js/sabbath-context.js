// Builds a real-time, location-aware context object that is sent to the AI
// chat backend on every message so it can reason about the user's actual
// local date/time and Seventh-day Adventist Sabbath status (Friday sunset ->
// Saturday sunset) instead of guessing or using server time.
(function (window) {
    'use strict';

    const GEO_CACHE_KEY = 'churchChatGeoPosition';
    const GEO_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours
    const SUNSET_CACHE_KEY = 'churchChatSunsetCache';
    const GEO_TIMEOUT_MS = 5000;

    // Best-effort timezone -> approximate location table so we can still
    // estimate sunset when the user denies/lacks geolocation. Not exhaustive;
    // falls back further to an offset-derived estimate if the zone is missing.
    const TZ_LOCATIONS = {
        'Asia/Manila': { lat: 14.5995, lon: 120.9842, country: 'Philippines', city: 'Manila' },
        'Asia/Tokyo': { lat: 35.6762, lon: 139.6503, country: 'Japan', city: 'Tokyo' },
        'Asia/Shanghai': { lat: 31.2304, lon: 121.4737, country: 'China', city: 'Shanghai' },
        'Asia/Hong_Kong': { lat: 22.3193, lon: 114.1694, country: 'Hong Kong', city: 'Hong Kong' },
        'Asia/Singapore': { lat: 1.3521, lon: 103.8198, country: 'Singapore', city: 'Singapore' },
        'Asia/Seoul': { lat: 37.5665, lon: 126.9780, country: 'South Korea', city: 'Seoul' },
        'Asia/Kolkata': { lat: 28.6139, lon: 77.2090, country: 'India', city: 'New Delhi' },
        'Asia/Jakarta': { lat: -6.2088, lon: 106.8456, country: 'Indonesia', city: 'Jakarta' },
        'Asia/Bangkok': { lat: 13.7563, lon: 100.5018, country: 'Thailand', city: 'Bangkok' },
        'Asia/Dubai': { lat: 25.2048, lon: 55.2708, country: 'United Arab Emirates', city: 'Dubai' },
        'Asia/Jerusalem': { lat: 31.7683, lon: 35.2137, country: 'Israel', city: 'Jerusalem' },
        'Asia/Kuala_Lumpur': { lat: 3.1390, lon: 101.6869, country: 'Malaysia', city: 'Kuala Lumpur' },
        'Asia/Karachi': { lat: 24.8607, lon: 67.0011, country: 'Pakistan', city: 'Karachi' },
        'Asia/Dhaka': { lat: 23.8103, lon: 90.4125, country: 'Bangladesh', city: 'Dhaka' },
        'Asia/Ho_Chi_Minh': { lat: 10.8231, lon: 106.6297, country: 'Vietnam', city: 'Ho Chi Minh City' },
        'Europe/London': { lat: 51.5074, lon: -0.1278, country: 'United Kingdom', city: 'London' },
        'Europe/Paris': { lat: 48.8566, lon: 2.3522, country: 'France', city: 'Paris' },
        'Europe/Berlin': { lat: 52.5200, lon: 13.4050, country: 'Germany', city: 'Berlin' },
        'Europe/Madrid': { lat: 40.4168, lon: -3.7038, country: 'Spain', city: 'Madrid' },
        'Europe/Rome': { lat: 41.9028, lon: 12.4964, country: 'Italy', city: 'Rome' },
        'Europe/Amsterdam': { lat: 52.3676, lon: 4.9041, country: 'Netherlands', city: 'Amsterdam' },
        'Europe/Athens': { lat: 37.9838, lon: 23.7275, country: 'Greece', city: 'Athens' },
        'Europe/Istanbul': { lat: 41.0082, lon: 28.9784, country: 'Turkey', city: 'Istanbul' },
        'Europe/Moscow': { lat: 55.7558, lon: 37.6173, country: 'Russia', city: 'Moscow' },
        'Africa/Lagos': { lat: 6.5244, lon: 3.3792, country: 'Nigeria', city: 'Lagos' },
        'Africa/Nairobi': { lat: -1.2921, lon: 36.8219, country: 'Kenya', city: 'Nairobi' },
        'Africa/Johannesburg': { lat: -26.2041, lon: 28.0473, country: 'South Africa', city: 'Johannesburg' },
        'Africa/Cairo': { lat: 30.0444, lon: 31.2357, country: 'Egypt', city: 'Cairo' },
        'America/New_York': { lat: 40.7128, lon: -74.0060, country: 'United States', city: 'New York' },
        'America/Chicago': { lat: 41.8781, lon: -87.6298, country: 'United States', city: 'Chicago' },
        'America/Denver': { lat: 39.7392, lon: -104.9903, country: 'United States', city: 'Denver' },
        'America/Los_Angeles': { lat: 34.0522, lon: -118.2437, country: 'United States', city: 'Los Angeles' },
        'America/Anchorage': { lat: 61.2181, lon: -149.9003, country: 'United States', city: 'Anchorage' },
        'Pacific/Honolulu': { lat: 21.3069, lon: -157.8583, country: 'United States', city: 'Honolulu' },
        'America/Toronto': { lat: 43.6532, lon: -79.3832, country: 'Canada', city: 'Toronto' },
        'America/Vancouver': { lat: 49.2827, lon: -123.1207, country: 'Canada', city: 'Vancouver' },
        'America/Mexico_City': { lat: 19.4326, lon: -99.1332, country: 'Mexico', city: 'Mexico City' },
        'America/Sao_Paulo': { lat: -23.5505, lon: -46.6333, country: 'Brazil', city: 'Sao Paulo' },
        'America/Argentina/Buenos_Aires': { lat: -34.6037, lon: -58.3816, country: 'Argentina', city: 'Buenos Aires' },
        'Australia/Sydney': { lat: -33.8688, lon: 151.2093, country: 'Australia', city: 'Sydney' },
        'Australia/Melbourne': { lat: -37.8136, lon: 144.9631, country: 'Australia', city: 'Melbourne' },
        'Australia/Perth': { lat: -31.9505, lon: 115.8605, country: 'Australia', city: 'Perth' },
        'Pacific/Auckland': { lat: -36.8485, lon: 174.7633, country: 'New Zealand', city: 'Auckland' }
    };

    const DEFAULT_LOCATION = { lat: 14.5995, lon: 120.9842, country: 'Philippines', city: 'Manila' };

    function readJson(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function writeJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            // storage unavailable (private mode, quota, etc.) - safe to ignore
        }
    }

    function getTimeZone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch (e) {
            return 'UTC';
        }
    }

    function timezoneFallbackLocation(timeZone, now) {
        const known = TZ_LOCATIONS[timeZone];
        if (known) return Object.assign({ source: 'timezone-lookup' }, known);

        // Estimate longitude from the UTC offset (15deg per hour); keep latitude
        // near the equator to minimize seasonal sunset error for unknown zones.
        const offsetHours = -now.getTimezoneOffset() / 60;
        const parts = (timeZone || '').split('/');
        const city = parts.length > 1 ? parts[parts.length - 1].replace(/_/g, ' ') : null;
        const region = parts.length > 1 ? parts[0].replace(/_/g, ' ') : null;

        return {
            lat: 15,
            lon: Math.max(-180, Math.min(180, offsetHours * 15)),
            country: region || 'Unknown',
            city: city,
            source: 'timezone-estimate'
        };
    }

    function getGeolocation() {
        return new Promise((resolve) => {
            const cached = readJson(GEO_CACHE_KEY);
            if (cached && (Date.now() - cached.timestamp) < GEO_CACHE_MAX_AGE_MS) {
                resolve(cached);
                return;
            }

            if (!('geolocation' in navigator)) {
                resolve(null);
                return;
            }

            let settled = false;
            const timer = setTimeout(() => {
                if (!settled) { settled = true; resolve(null); }
            }, GEO_TIMEOUT_MS);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    const result = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        country: null,
                        city: null,
                        source: 'geolocation',
                        timestamp: Date.now()
                    };
                    writeJson(GEO_CACHE_KEY, result);
                    resolve(result);
                },
                () => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    resolve(null);
                },
                { enableHighAccuracy: false, timeout: GEO_TIMEOUT_MS, maximumAge: GEO_CACHE_MAX_AGE_MS }
            );
        });
    }

    async function resolveLocation(timeZone, now) {
        const geo = await getGeolocation();
        if (geo && typeof geo.lat === 'number' && typeof geo.lon === 'number') {
            return geo;
        }
        const fallback = timezoneFallbackLocation(timeZone, now);
        if (typeof fallback.lat === 'number' && typeof fallback.lon === 'number') {
            return fallback;
        }
        return Object.assign({ source: 'default' }, DEFAULT_LOCATION);
    }

    function dateKey(date) {
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }

    // Returns { sabbathStartsAt, sabbathEndsAt } Date objects for the Friday
    // sunset -> Saturday sunset window that "now" falls in or is approaching.
    function getSabbathWindow(now, lat, lon) {
        const dayOfWeek = now.getDay(); // Sun=0 ... Sat=6
        const daysSinceFriday = (dayOfWeek - 5 + 7) % 7;

        const friday = new Date(now);
        friday.setHours(0, 0, 0, 0);
        friday.setDate(friday.getDate() - daysSinceFriday);

        const saturday = new Date(friday);
        saturday.setDate(friday.getDate() + 1);

        const cacheKey = dateKey(friday) + '|' + lat.toFixed(2) + ',' + lon.toFixed(2);
        const cached = readJson(SUNSET_CACHE_KEY);
        if (cached && cached.cacheKey === cacheKey) {
            return {
                sabbathStartsAt: new Date(cached.sabbathStartsAt),
                sabbathEndsAt: new Date(cached.sabbathEndsAt)
            };
        }

        const fridayTimes = window.SunCalc.getTimes(friday, lat, lon);
        const saturdayTimes = window.SunCalc.getTimes(saturday, lat, lon);
        const result = {
            sabbathStartsAt: fridayTimes.sunset,
            sabbathEndsAt: saturdayTimes.sunset
        };

        writeJson(SUNSET_CACHE_KEY, {
            cacheKey,
            sabbathStartsAt: result.sabbathStartsAt.toISOString(),
            sabbathEndsAt: result.sabbathEndsAt.toISOString()
        });

        return result;
    }

    async function getSabbathContext() {
        const now = new Date();
        const timeZone = getTimeZone();
        const location = await resolveLocation(timeZone, now);

        let sabbathStartsAt = null, sabbathEndsAt = null, sabbathStatus = 'unknown';
        let hoursUntilSabbathBegins = null, hoursSinceSabbathEnded = null;

        if (window.SunCalc && typeof location.lat === 'number' && typeof location.lon === 'number') {
            const window_ = getSabbathWindow(now, location.lat, location.lon);
            sabbathStartsAt = window_.sabbathStartsAt;
            sabbathEndsAt = window_.sabbathEndsAt;

            if (now < sabbathStartsAt) {
                sabbathStatus = 'before';
                hoursUntilSabbathBegins = (sabbathStartsAt - now) / 3600000;
            } else if (now <= sabbathEndsAt) {
                sabbathStatus = 'during';
            } else {
                sabbathStatus = 'after';
                hoursSinceSabbathEnded = (now - sabbathEndsAt) / 3600000;
            }
        }

        const formatter = new Intl.DateTimeFormat('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
        });

        return {
            localTimeFormatted: formatter.format(now),
            localTimeISO: now.toString(),
            timeZone,
            country: location.country || null,
            city: location.city || null,
            locationSource: location.source || 'unknown',
            latitude: location.lat,
            longitude: location.lon,
            sabbathStatus,
            sabbathStartsAtFormatted: sabbathStartsAt ? formatter.format(sabbathStartsAt) : null,
            sabbathEndsAtFormatted: sabbathEndsAt ? formatter.format(sabbathEndsAt) : null,
            hoursUntilSabbathBegins: hoursUntilSabbathBegins !== null ? Math.round(hoursUntilSabbathBegins * 10) / 10 : null,
            hoursSinceSabbathEnded: hoursSinceSabbathEnded !== null ? Math.round(hoursSinceSabbathEnded * 10) / 10 : null
        };
    }

    window.getSabbathContext = getSabbathContext;

})(window);
