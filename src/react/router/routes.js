import React from 'react';
import SmokeTestsPage from '../pages/home';

const testsRoutes = [
  {
    name: 'SmokeTestsPage',
    component: SmokeTestsPage,
    path: 'tests',
    options: {
      headerShown: false,
      headerBackVisible: false,
      showBottomToolBar: false,
      showCompanyFilter: false,
      title: 'Resultados de testes',
    },
  },
];

export default testsRoutes;
