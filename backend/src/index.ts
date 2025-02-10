import { config } from "dotenv";
config();

import cluster from "cluster";
import { availableParallelism } from "os";

if (cluster.isPrimary) {
  const numCPUs = availableParallelism();
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // if a worker dies, create a new one by simply forking another one
  cluster.on("exit", (worker) => {
    console.log(`worker  ${worker.process.pid} died`);
    cluster.fork();
  });
}
else{
    const app = require("./server").default;
    const PORT = process.env.PORT || 4001;
    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
    })
}

console.log("The domain is ", process.env.VITE_DOMAIN_NAME);

setInterval(() => {
  if (process.env.VITE_DOMAIN_NAME) {
    fetch(process.env.VITE_DOMAIN_NAME);
  }
}, 1000*9*60);