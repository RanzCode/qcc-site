/*
 SunCalc (https://github.com/mourner/suncalc) — BSD 2-Clause License.
 Vendored locally (no CDN/network dependency) so the church chat widget can
 compute local sunrise/sunset without hardcoded times or external API calls.
 Only the pieces the Sabbath-timing feature needs are kept: getTimes() (and
 the position math it depends on).
*/
(function (global) {
    'use strict';

    const PI = Math.PI, sin = Math.sin, cos = Math.cos, tan = Math.tan,
        asin = Math.asin, atan = Math.atan2, acos = Math.acos, rad = PI / 180;

    // date/time constants and conversions
    const dayMs = 1000 * 60 * 60 * 24, J1970 = 2440588, J2000 = 2451545;

    function toJulian(date) { return date.valueOf() / dayMs - 0.5 + J1970; }
    function fromJulian(j) { return new Date((j + 0.5 - J1970) * dayMs); }
    function toDays(date) { return toJulian(date) - J2000; }

    // general calculations for position
    const e = rad * 23.4397; // obliquity of the Earth

    function rightAscension(l, b) { return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l)); }
    function declination(l, b) { return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l)); }

    function solarMeanAnomaly(d) { return rad * (357.5291 + 0.98560028 * d); }

    function eclipticLongitude(M) {
        const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)); // equation of center
        const P = rad * 102.9372; // perihelion of the Earth
        return M + C + P + PI;
    }

    function sunCoords(d) {
        const M = solarMeanAnomaly(d), L = eclipticLongitude(M);
        return { dec: declination(L, 0), ra: rightAscension(L, 0) };
    }

    // calculates sun position for a given date and latitude/longitude
    function getPosition(date, lat, lng) {
        const lw = rad * -lng, phi = rad * lat, d = toDays(date), c = sunCoords(d),
            H = siderealTime(d, lw) - c.ra;
        return {
            azimuth: atan(sin(H), cos(H) * sin(phi) - tan(c.dec) * cos(phi)),
            altitude: asin(sin(phi) * sin(c.dec) + cos(phi) * cos(c.dec) * cos(H))
        };
    }

    function siderealTime(d, lw) { return rad * (280.16 + 360.9856235 * d) - lw; }

    // calculations for sun times
    const J0 = 0.0009;

    function julianCycle(d, lw) { return Math.round(d - J0 - lw / (2 * PI)); }
    function approxTransit(Ht, lw, n) { return J0 + (Ht + lw) / (2 * PI) + n; }
    function solarTransitJ(ds, M, L) { return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L); }
    function hourAngle(h, phi, d) { return acos((sin(h) - sin(phi) * sin(d)) / (cos(phi) * cos(d))); }
    function observerAngle(height) { return -2.076 * Math.sqrt(height) / 60; }

    function getSetJ(h, lw, phi, dec, n, M, L) {
        const w = hourAngle(h, phi, dec), a = approxTransit(w, lw, n);
        return solarTransitJ(a, M, L);
    }

    // sun times configuration: [angle, morning name, evening name]
    const times = [
        [-0.833, 'sunrise', 'sunset']
    ];

    function getTimes(date, lat, lng, height) {
        height = height || 0;

        const lw = rad * -lng, phi = rad * lat,
            dh = observerAngle(height),
            d = toDays(date), n = julianCycle(d, lw), ds = approxTransit(0, lw, n),
            M = solarMeanAnomaly(ds), L = eclipticLongitude(M), dec = declination(L, 0),
            Jnoon = solarTransitJ(ds, M, L);

        const result = {
            solarNoon: fromJulian(Jnoon),
            nadir: fromJulian(Jnoon - 0.5)
        };

        for (let i = 0, len = times.length; i < len; i += 1) {
            const time = times[i];
            const h0 = (time[0] + dh) * rad;

            const Jset = getSetJ(h0, lw, phi, dec, n, M, L);
            const Jrise = Jnoon - (Jset - Jnoon);

            result[time[1]] = fromJulian(Jrise);
            result[time[2]] = fromJulian(Jset);
        }

        return result;
    }

    global.SunCalc = { getTimes, getPosition };

})(typeof window !== 'undefined' ? window : this);
