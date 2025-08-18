import SideBar from '../components/common/SideBar';

const PublicLayout = ({ children }) => {
  return (
    <>
      <SideBar />
      <main>{children}</main>
    </>
  );
};

export default PublicLayout;
