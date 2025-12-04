import React from 'react';

const DashboardOverview = () => {
  const stats = [
    {
      title: 'Farm Health Score',
      value: '87%',
      icon: 'bi-heart-pulse',
      color: 'success'
    },
    {
      title: 'Active Crops',
      value: '12',
      icon: 'bi-flower2',
      color: 'primary'
    },
    {
      title: 'Soil Quality',
      value: 'Good',
      icon: 'bi-dirt',
      color: 'warning'
    },
    {
      title: 'Weather Alert',
      value: 'Clear',
      icon: 'bi-sun',
      color: 'info'
    }
  ];

  return (
    <section className="mb-5">
      <h2 className="h4 fw-bold mb-4">Farm Overview</h2>
      <div className="row g-4">
        {stats.map((stat, index) => (
          <div key={index} className="col-md-6 col-lg-3">
            <div className="stat-card">
              <div className="d-flex align-items-center mb-3">
                <div className={`rounded-circle p-3 me-3 bg-${stat.color} bg-opacity-10`}>
                  <i className={`${stat.icon} text-${stat.color} fs-4`}></i>
                </div>
                <div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="text-muted small">{stat.title}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DashboardOverview;