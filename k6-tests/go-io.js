import http from "k6/http";
import { check } from "k6";

export const options = {
    vus: 10,
    duration: "10s",
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"]
};

export default function () {
    const response = http.get("http://localhost:8080/io");

    check(response, {
        "status is 200": (r) => r.status === 200,
    });
}
