exports.handler = async function handler() {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Terraform bootstrap artifact. Deploy code via CI/CD." })
  };
};

exports.main = exports.handler;
