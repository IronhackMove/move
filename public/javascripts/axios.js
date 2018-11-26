class APIHandler {
  constructor(baseUrl) {
    this.BASE_URL = baseUrl;
  }


getFullList() {
  return axios
    .get(`${this.BASE_URL}/epoint/getPointsOfCharge`)
    .then(points => points.data);
  }

}