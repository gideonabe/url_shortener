import http from "k6/http";

const BASE_URL = "https://url-shortener-a87n.onrender.com";
const SHORT_CODE = "kcsnmUs";

export const options = {
  scenarios: {
    redirect_test: {
      executor: "constant-arrival-rate",
      rate: 10,
      timeUnit: "1s",
      duration: "30s",
      preAllocatedVUs: 10,
      maxVUs: 50,
    },
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/${SHORT_CODE}`, {
    redirects: 0,
  });

  console.log(`STATUS: ${res.status} | BODY: ${res.body}`);
}
