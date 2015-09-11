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
  \file terrama2/core/DataSet.hpp

  \brief Metadata about a given dataset.

  \author Gilberto Ribeiro de Queiroz
  \author Jano Simas
  \author Paulo R. M. Oliveira
  \author Vinicius Campanha
*/

#ifndef __TERRAMA2_CORE_DATASET_HPP__
#define __TERRAMA2_CORE_DATASET_HPP__



// STL
#include <memory>
#include <string>
#include <cstdint>

//Boost
#include <boost/date_time/posix_time/posix_time_types.hpp>



namespace terrama2
{
  namespace core
  {

    class DataProvider;
    typedef std::shared_ptr<DataProvider> DataProviderPtr;

    /*!
      \class DataSet

      \brief Contains metadata about data servers.

      A data provider can be a remote server that provides data through
      FTP protocol or an OGC Web Service, such as WFS, WCS or SOS.

      It can also be an URI for a folder into the file system...
     */
    class DataSet
    {
      public:

      //! Dataset type.
      enum Kind
      {
        UNKNOWN_TYPE,
        PCD_TYPE,
        OCCURENCE_TYPE,
        GRID_TYPE
      };

      //! Dataset unit of time.
      enum UOT
      {
        UNKNOWN_UOT,
        MILISECOND,
        SECOND,
        MINUTE,
        HOUR,
        DAY,
        WEEK,
        MONTH,
        YEAR
      };

      //! Dataset status.
      enum Status
      {
        ACTIVE,
        INACTIVE
      };

      DataSet(DataProviderPtr provider);

      ~DataSet();

      public:

        /*!
          \brief It returns the identifier of the dataset.

          \return The identifier of the dataset.
        */
        uint64_t id() const;

        /*!
          \brief It returns the name of the dataset.

          \return The name of the dataset.
        */
        std::string name() const;

        /*!
          \brief It sets the name of the dataset.

          \param The name of the dataset.
        */
        void setName(const std::string& name);

        /*!
          \brief It returns the the description of the dataset.

          \return The the description of the dataset.
        */
        std::string description() const;

        /*!
          \brief It sets the the description of the data provider.

          \param The the description of the dataset.
        */
        void setDescription(const std::string& description);

        /*!
          \brief It returns the the kind of the dataset.

          \return The the kind of the dataset.
        */
        Kind kind() const;

        /*!
          \brief It sets the the kind of the dataset.

          \param The the kind of the data provider.
        */
        void setKind(const Kind& kind);

        /*!
          \brief It returns the the status of the data provider.

          \return The the status of the data provider.
        */
        Status status() const;

        /*!
          \brief It sets the the status of the data provider.

          \param The the status of the data provider.
        */
        void setStatus(const Status& status);

        /*!
          \brief It returns the the data provider.

          \return The the data provider.
        */
        DataProviderPtr dataProvider() const;

        /*!
          \brief It returns the .
        
          \return The .
        */
        double dataFrequency() const;
        
        /*!
          \brief It sets the freque.
        
          \param The .
        */
        void setDataFrequency(const double& dataFrequency);

      protected:

        /*!
          \brief It sets the identifier of the dataset.

          \param The identifier of the dataset.
        */
        void setId(uint64_t id);


      private:

        uint64_t id_;
        std::string name_;
        std::string description_;
        Status status_;
        DataProviderPtr dataProvider_;
        Kind kind_;
        boost::posix_time::time_duration dataFrequency_;
        boost::posix_time::time_duration schedule_;
        boost::posix_time::time_duration scheduleRetry_;
        boost::posix_time::time_duration scheduleTimeout_;

      friend class DataSetDAO; //review
    };

    typedef std::shared_ptr<DataSet> DataSetPtr;

  } // end namespace core
}   // end namespace terrama2

#endif  // __TERRAMA2_CORE_DATASET_HPP__
