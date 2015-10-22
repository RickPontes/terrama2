/*
  Copyright (C) 2007 National Institute For Space Research (INPE) - Brazil.

  This file is part of TerraMA2 - a free and open source computational
  platform for analysis, monitoring, and alert of geo-environmental extremes.

  TerraMA2 is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License,
  or (at your option) any later version.

  TerraMA2 is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with TerraMA2. See LICENSE. If not, write to
  TerraMA2 Team at <terrama2-team@dpi.inpe.br>.
*/

/*!
  \file terrama2/integration_test/ws/TestClient.cpp

  \brief Tests for the Web Server.

  \author Vinicius Campanha
*/

// STL
#include <memory>

// TerraMA2 Test
#include "TestClient.hpp"
#include "Utils.hpp"

// TerraMA2
#include <terrama2/core/ApplicationController.hpp>
#include <terrama2/core/DataManager.hpp>
#include <terrama2/ws/collector/client/Exception.hpp>

void TestClient::initTestCase()
{
  // VINICIUS: don't working, depends on TerraLib5
//  CreateDatabase();
}


void TestClient::cleanupTestCase()
{
  // VINICIUS: don't working, depends on TerraLib5
//  DropDatabase();
}


void TestClient::init()
{
  wsClient_ = new terrama2::ws::collector::Client("http://localhost:1989");

  clearDatabase();
}


void TestClient::cleanup()
{
  clearDatabase();

  delete wsClient_;
}


void TestClient::clearDatabase()
{
  std::shared_ptr<te::da::DataSource> dataSource = terrama2::core::ApplicationController::getInstance().getDataSource();

  std::auto_ptr<te::da::DataSourceTransactor> transactor = dataSource->getTransactor();
  transactor->begin();

  std::string query = "TRUNCATE TABLE terrama2.data_provider CASCADE";
  transactor->execute(query);

  transactor->commit();
}


terrama2::core::DataProvider TestClient::buildDataProvider()
{

  terrama2::core::DataProvider  dataProvider("Data Provider", (terrama2::core::DataProvider::Kind)1, 0);

  dataProvider.setUri("pathDataProvider");
  dataProvider.setDescription("Data Provider Description");
  dataProvider.setStatus((terrama2::core::DataProvider::Status)1);

  return dataProvider;
}


terrama2::core::DataSet TestClient::buildDataSet()
{
  terrama2::core::DataProvider dataProvider = buildDataProvider();

  wsClient_->addDataProvider(dataProvider);

  terrama2::core::DataSet dataSet("Data Set Name", (terrama2::core::DataSet::Kind)1, 0, dataProvider.id());

  dataSet.setDescription("Data Set Description");
  dataSet.setStatus((terrama2::core::DataSet::Status)1);

  boost::posix_time::time_duration dataFrequency(boost::posix_time::duration_from_string("00:05:00.00"));
  boost::posix_time::time_duration schedule(boost::posix_time::duration_from_string("00:06:00.00"));
  boost::posix_time::time_duration scheduleRetry(boost::posix_time::duration_from_string("00:07:00.00"));
  boost::posix_time::time_duration scheduleTimeout(boost::posix_time::duration_from_string("00:08:00.00"));

  dataSet.setDataFrequency(te::dt::TimeDuration(dataFrequency));
  dataSet.setSchedule(te::dt::TimeDuration(schedule));
  dataSet.setScheduleRetry(te::dt::TimeDuration(scheduleRetry));
  dataSet.setScheduleTimeout(te::dt::TimeDuration(scheduleTimeout));

  return dataSet;
}


void TestClient::TestStatus()
{
  std::string answer;

  try
  {
    wsClient_->ping(answer);

    std::cout << answer << std::endl;
  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Should not be here");
  }
}


void TestClient::TestWrongConection()
{
  std::string answer;
  try
  {
    terrama2::ws::collector::Client wsClient("http://wrongaddress:00");

    wsClient.ping(answer);

    QFAIL("Can't connect to a wrong address!");
  }
  catch(terrama2::Exception &e)
  {
    // test ok
    qDebug() << boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str();
  }
  catch(...)
  {
    QFAIL("Exception unexpected!");
  }
}


void TestClient::TestAddDataProvider()
{
  try
  {
    terrama2::core::DataProvider dataProvider = buildDataProvider();

    wsClient_->addDataProvider(dataProvider);

    QVERIFY2(dataProvider.id() != 0 , "Can't create a Data Provider with a invalid ID!");

  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Exception unexpected!");
  }
}


void TestClient::TestAddNullDataProvider()
{
  try
  {
    terrama2::core::DataProvider dataProvider;

    wsClient_->addDataProvider(dataProvider);

    QFAIL("Should not add a null Data Provider");
  }
  catch(terrama2::Exception &e)
  {
    // test OK
    qDebug() << boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str();
  }
  catch(...)
  {
    QFAIL("Exception unexpected!");
  }
}


void TestClient::testRemoveDataProvider()
{
  try
  {
    terrama2::core::DataProvider dataProvider = buildDataProvider();

    wsClient_->addDataProvider(dataProvider);

    QVERIFY2(dataProvider.id() != 0 , "Can't create a Data Provider with a invalid ID!");

    wsClient_->removeDataProvider(dataProvider.id());
  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Exception unexpected!");
  }
}


void TestClient::testRemoveDataProviderInvalidId()
{
  try
  {
    wsClient_->removeDataProvider(1);
  }
  catch(terrama2::Exception &e)
  {
    // test OK
    qDebug() << boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str();
  }
  catch(...)
  {
    QFAIL("Unexpected exception !");
  }
}


void TestClient::testUpdateDataProvider()
{
  try
  {
    terrama2::core::DataProvider dataProvider = buildDataProvider();

    wsClient_->addDataProvider(dataProvider);

    QVERIFY2(dataProvider.id() != 0 , "Can't create a Data Provider with a invalid ID!");

    uint64_t id = dataProvider.id();

    dataProvider.setDescription("Description updated");
    dataProvider.setKind((terrama2::core::DataProvider::Kind)2);
    dataProvider.setName("Name updated");
    dataProvider.setStatus((terrama2::core::DataProvider::Status)2);
    dataProvider.setUri("URI_updated");

    wsClient_->updateDataProvider(dataProvider);

    QVERIFY2(dataProvider.id() == id, "Update failed!");
    QCOMPARE(dataProvider.description().c_str(), "Description updated");
    QCOMPARE((int)dataProvider.kind(), 2);
    QCOMPARE(dataProvider.name().c_str(), "Name updated");
    QCOMPARE((int)dataProvider.status(), 2);
    QCOMPARE(dataProvider.uri().c_str(), "URI_updated");

  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::testUpdateDataProviderWrongID()
{
  try
  {
    terrama2::core::DataProvider dataProvider = buildDataProvider();

    dataProvider.setId(1);

    wsClient_->updateDataProvider(dataProvider);

    QFAIL("Should not update a invalid Data Set!");
  }
  catch(terrama2::Exception &e)
  {
    // test OK
    qDebug() << boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str();
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::testFindDataProvider()
{
  try
  {
    terrama2::core::DataProvider dataProvider = buildDataProvider();

    wsClient_->addDataProvider(dataProvider);

    QVERIFY2(dataProvider.id() != 0 , "Can't create a Data Provider with a invalid ID!");



    dataProvider.id();

    terrama2::core::DataProvider dataProvider_found = wsClient_->findDataProvider(dataProvider.id());

    QVERIFY2(dataProvider.id() == dataProvider_found.id(), "Find failed!");
    QVERIFY2(dataProvider.description() == dataProvider_found.description(), "Find failed!");
    QVERIFY2(dataProvider.kind() == dataProvider_found.kind(), "Find failed!");
    QVERIFY2(dataProvider.name() == dataProvider_found.name(), "Find failed!");
    QVERIFY2(dataProvider.status() == dataProvider_found.status(), "Find failed!");
    QVERIFY2(dataProvider.uri() == dataProvider_found.uri(), "Find failed!");

  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::testFindDataProviderInvalidID()
{
  try
  {
    terrama2::core::DataProvider dataProvider_found(wsClient_->findDataProvider(1));

    QFAIL("Should not find a invalid Data Provider!");
  }
  catch(terrama2::Exception &e)
  {
    // test OK
    qDebug() << boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str();
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }

}


void TestClient::testListDataProvider()
{
  try
  {
    terrama2::core::DataProvider dataProvider = buildDataProvider();

    wsClient_->addDataProvider(dataProvider);

    dataProvider.setId(0);
    dataProvider.setName("Data Provider2");

    wsClient_->addDataProvider(dataProvider);

    std::vector< terrama2::core::DataProvider > list_dataProvider;

    wsClient_->listDataProvider(list_dataProvider);

    QCOMPARE(list_dataProvider.size(), 2uL);
  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }

}

void TestClient::TestAddDataSet()
{
  try
  {
    terrama2::core::DataSet dataSet = buildDataSet();

    wsClient_->addDataSet(dataSet);

    QVERIFY2(dataSet.id() != 0 , "Can't create a Data Provider with a invalid ID!");
  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::TestAddNullDataSet()
{
  try
  {
    terrama2::core::DataSet dataSet;

    wsClient_->addDataSet(dataSet);

    QFAIL("Should not add a null Data Provider");
  }
  catch(terrama2::Exception &e)
  {
    // test OK
    qDebug() << boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str();
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::TestAddDataSetWithID()
{
  try
  {

  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::TestAddDataSetWithWrongDataProviderID()
{
  try
  {

  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::testRemoveDataSet()
{
  try
  {
    terrama2::core::DataSet dataSet = buildDataSet();

    wsClient_->addDataSet(dataSet);

    QVERIFY2(dataSet.id() != 0 , "Can't create a Data Provider with a invalid ID!");

    wsClient_->removeDataSet(dataSet.id());
  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::testRemoveDataSetInvalidId()
{
  try
  {

  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::testUpdateDataSet()
{
  try
  {


  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::testUpdateDataSetInvalidId()
{
  try
  {


  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::testFindDataSet()
{
  try
  {


  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::testFindDataSetInvalidID()
{
  try
  {


  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::testListDataSet()
{
  try
  {
    terrama2::core::DataSet dataSet = buildDataSet();

    wsClient_->addDataSet(dataSet);

    dataSet.setId(0);
    dataSet.setName("Data Set2");

    wsClient_->addDataSet(dataSet);

    std::vector< terrama2::core::DataSet > list_dataSet;

    wsClient_->listDataSet(list_dataSet);

    QCOMPARE(list_dataSet.size(), 2uL);
  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Unexpected exception!");
  }
}


void TestClient::testShutdownWebService()
{
  try
  {
    wsClient_->shutdown();
  }
  catch(terrama2::Exception &e)
  {
    QFAIL(boost::get_error_info< terrama2::ErrorDescription >(e)->toStdString().c_str());
  }
  catch(...)
  {
    QFAIL("Exception unexpected!");
  }
}
