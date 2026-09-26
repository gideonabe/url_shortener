import http from "k6/http";
import { check } from "k6";

const BASE_URL = "https://url-shortener-a87n.onrender.com";
// const SHORT_CODE = "kcsnmUs";

export const options = {
  scenarios: {
    redirect_test: {
      executor: "constant-arrival-rate",
      rate: 45,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 30,
      maxVUs: 100,
    },
  },

  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

// export default function () {
//   const res = http.get(`${BASE_URL}/${SHORT_CODE}`, {
//     redirects: 0,
//   });

//   console.log(`STATUS: ${res.status} | BODY: ${res.body}`);
// }

export default function () {
  const res = http.get(`${BASE_URL}/health`);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}