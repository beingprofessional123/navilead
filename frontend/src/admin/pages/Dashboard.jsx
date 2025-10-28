import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import MobileHeader from '../components/MobileHeader';

const Dashboard = () => {
  const { t: translate } = useTranslation();

  return (
    <div className="mainbody">
      <div className="container-fluid">
        <MobileHeader />
      </div>
    </div>
  );
};

export default Dashboard;