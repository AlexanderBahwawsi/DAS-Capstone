/**
 * Reusable Express response mock for unit tests.
 * Captures status code, JSON body, and exposes jest.fn spies.
 */
function mockRes() {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = jest.fn(function (code) {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn(function (payload) {
    res.body = payload;
    return res;
  });
  res.send = jest.fn(function (payload) {
    res.body = payload;
    return res;
  });
  return res;
}

module.exports = { mockRes };
