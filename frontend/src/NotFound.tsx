import { Link } from "react-router-dom";

const NotFound = () => {
  const pathName = window.location.pathname;
  return (
    <div className="flex flex-col min-h-screen pt-12 items-center">
      <h1 className="text-[4rem] font-extrabold">404</h1> 
      <h2 className="text-3xl mt-4 mb-3 font-semibold"> Page not Found</h2> 
      The following path could not be found: &nbsp;&nbsp;{" "}
      <div className="text-orange-500 mb-4">{pathName}</div>
      Lets go back to <Link className="font-semibold text-blue-400" to={'/'}> Home</Link>
    </div>
  );
};

export default NotFound;
