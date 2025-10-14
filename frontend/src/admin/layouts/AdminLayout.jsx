import SideBar from '../components/SideBar';

const PublicLayout = ({ children }) => {
  return (
    <>
      <SideBar />
      <main>{children}</main>
    </>
  );
};

export default PublicLayout;
