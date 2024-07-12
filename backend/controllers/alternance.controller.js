// on importe les paquets et fichiers necessaire pour notre app
// import dotenv from "dotenv";

import mongoose from "mongoose";
import fetch from 'node-fetch';
import Bottleneck from "bottleneck";

//Function to use a specific database and display the list of collections in that database
export async function getListDatabaseCollectionController(req, res) {
  try {
    // Get the native MongoDB client from the Mongoose connection
    const db = mongoose.connection.db;
    // Log to ensure we have a valid connection
    // console.log("Current Database:", db.databaseName);

    // List all collections in the alterance database
    const collections = await db.listCollections().toArray();
    // console.log(collections);

    // Send the collections as a response
    res.status(200).json(collections);
  } catch (err) {
    // sinon on retourne le message d'erreur
    res.status(500).json({ message: err.message });
  }
}

// function for specific collection and display its content
export async function getCollectionContents(req, res) {
  try {

    // Ensure that the database connection is established
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection is not established');
    }
 
    const db = mongoose.connection.db;
    const collectionName = req.params.name;

    // Log to ensure we have the correct collection name
    console.log("Requested Collection:", collectionName);

    const collection = db.collection(collectionName);
    const contents = await collection.find({}).toArray();

    // Log the contents to debug
    console.log("Contents:", contents);

    res.status(200).json(contents);
  } catch (err) {
    console.error("Error fetching collection contents:", err);
    res.status(500).json({ message: err.message });
  }
}


export async function postCollectionContents(req, res) {
  try {
    const db = mongoose.connection.db;
    const collectionName = req.params.name;
    const collection = db.collection(collectionName);
    const data = req.body;

    // Log to ensure we have the correct collection name
    console.log("Requested Collection:", collectionName);

    // Log the contents to debug
    console.log("Data:", data);

    const result = await collection.insertOne(data);

    res.status(200).json(result);
  } catch (err) {
    console.error("Error posting document contents:", err);
    res.status(500).json({ message: err.message });
  }
}

export async function refreshCollectionMetier(req, res) {
  try {
    const response = await fetch('https://labonnealternance-recette.apprentissage.beta.gouv.fr/api/v1/metiers/all', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }

    const data = await response.json();
    console.log("Fetched Data:", data); // Log the response data
    const db = mongoose.connection.db;
    const collection = db.collection('metiers');

    // Clear existing documents in the collection
    await collection.deleteMany({});

    // Insert each element of the array as a separate document
    if (Array.isArray(data.metiers)) {
      let toInsert = data.metiers;
      const insertPromises = toInsert.map((item) =>
        collection.insertOne({ metier: item })
      );

      await Promise.all(insertPromises);
      console.log('All metiers have been inserted into the collection');
    };
    // console.log("Data:", data.metiers[0]);
    

    res.status(201).json(data); // Respond with the fetched data
  } catch (err) {
    console.error("Error refreshing document from API contents:", err);
    res.status(500).json({ message: err.message }); // Send an appropriate error response
  }
}



// Initialiser le limiteur de débit pour respecter la limite de 7 appels par seconde
const limiterFormation = new Bottleneck({
  maxConcurrent: 1,
  minTime: 143 // Environ 1000 ms divisé par 7
});

export async function refreshCollectionFormations(req, res) {
  const codes_rome = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
  const coordinates = [
    { lat: 48.12866, lon: -2.21260 },
    { lat: 49.27703, lon: 2.28029 },
    { lat: 48.33565, lon: 5.61372 },
    { lat: 46.17065, lon: 0.22199 },
    { lat: 46.54239, lon: 2.87217 },
    { lat: 46.62781, lon: 5.64658 },
    { lat: 44.59944, lon: 5.48094 },
    { lat: 44.82028, lon: 2.45808 },
    { lat: 44.27402, lon: 0.49115 },
    { lat: 43.34719, lon: 4.19726 },
    { lat: 42.75682, lon: 8.23465 }
  ];

  try {
    const db = mongoose.connection.db;
    const collection = db.collection('formations');
    await collection.deleteMany({});

    const existingIds = new Set((await collection.find({}, { projection: { _id: 1 } }).toArray()).map(doc => doc._id));

    for (const code of codes_rome) {
      for (const { lat, lon } of coordinates) {
        const url = `https://labonnealternance-recette.apprentissage.beta.gouv.fr/api/v1/formations?romeDomain=${code}&latitude=${lat}&longitude=${lon}&radius=200&caller=%20%20&options=with_description`;

        try {
          const response = await limiterFormation.schedule(() => fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors'
          }));

          if (!response.ok) {
            throw new Error(`Network response was not ok for ROME code ${code} at coordinates (${lat}, ${lon}): ${response.statusText}`);
          }

          const data = await response.json();
          const filteredData = data.results.filter(formation => !existingIds.has(formation.id));
          const insertPromises = filteredData.map(formation => {
            existingIds.add(formation.id);
            return collection.insertOne({ formation });
          });
          await Promise.all(insertPromises);
          console.log(`Inserted ${filteredData.length} unique formations for ROME code ${code} at coordinates (${lat}, ${lon})`);
        } catch (error) {
          console.error(`Failed to fetch or insert data for ROME code ${code} at coordinates (${lat}, ${lon}): ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1 seconde avant de réessayer
        }
      }
    }
    res.status(201).json({ message: 'All formations have been refreshed and inserted into the collection.' });
  } catch (err) {
    console.error("Error refreshing formations from API:", err);
    res.status(500).json({ message: err.message });
  }
}


// Initialiser le limiteur de débit pour respecter la limite de 5 appels par seconde
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 200  // Environ 1000 ms / 5
});

// Quelques codes ROME pour la démonstration
const rome_codes = [
'A1101',
'A1201',
'A1202',
'A1203',
'A1204',
'A1205',
'A1301',
'A1302',
'A1303',
'A1401',
'A1402',
'A1403',
'A1404',
'A1405',
'A1406',
'A1407',
'A1408',
'A1409',
'A1410',
'A1411',
'A1412',
'A1413',
'A1414',
'A1415',
'A1416',
'A1417',
'A1501',
'A1502',
'A1503',
'A1504',
'B1101',
'B1201',
'B1301',
'B1302',
'B1303',
'B1401',
'B1402',
'B1501',
'B1601',
'B1602',
'B1603',
'B1604',
'B1701',
'B1801',
'B1802',
'B1803',
'B1804',
'B1805',
'B1806',
'C1101',
'C1102',
'C1103',
'C1104',
'C1105',
'C1106',
'C1107',
'C1108',
'C1109',
'C1110',
'C1201',
'C1202',
'C1203',
'C1204',
'C1205',
'C1206',
'C1207',
'C1301',
'C1302',
'C1303',
'C1401',
'C1501',
'C1502',
'C1503',
'C1504',
'D1101',
'D1102',
'D1103',
'D1104',
'D1105',
'D1106',
'D1107',
'D1201',
'D1202',
'D1203',
'D1204',
'D1205',
'D1206',
'D1207',
'D1208',
'D1209',
'D1210',
'D1211',
'D1212',
'D1213',
'D1214',
'D1301',
'D1401',
'D1402',
'D1403',
'D1404',
'D1405',
'D1406',
'D1407',
'D1408',
'D1501',
'D1502',
'D1503',
'D1504',
'D1505',
'D1506',
'D1507',
'D1508',
'D1509',
'E1101',
'E1102',
'E1103',
'E1104',
'E1105',
'E1106',
'E1107',
'E1108',
'E1201',
'E1202',
'E1203',
'E1204',
'E1205',
'E1301',
'E1302',
'E1303',
'E1304',
'E1305',
'E1306',
'E1307',
'E1308',
'E1401',
'E1402',
'F1101',
'F1102',
'F1103',
'F1104',
'F1105',
'F1106',
'F1107',
'F1108',
'F1201',
'F1202',
'F1203',
'F1204',
'F1301',
'F1302',
'F1401',
'F1402',
'F1501',
'F1502',
'F1503',
'F1601',
'F1602',
'F1603',
'F1604',
'F1605',
'F1606',
'F1607',
'F1608',
'F1609',
'F1610',
'F1611',
'F1612',
'F1613',
'F1701',
'F1702',
'F1703',
'F1704',
'F1705',
'F1706',
'G1101',
'G1102',
'G1201',
'G1202',
'G1203',
'G1204',
'G1205',
'G1206',
'G1301',
'G1302',
'G1303',
'G1401',
'G1402',
'G1403',
'G1404',
'G1501',
'G1502',
'G1503',
'G1601',
'G1602',
'G1603',
'G1604',
'G1605',
'G1701',
'G1702',
'G1703',
'G1801',
'G1802',
'G1803',
'G1804',
'H1101',
'H1102',
'H1201',
'H1202',
'H1203',
'H1204',
'H1205',
'H1206',
'H1207',
'H1208',
'H1209',
'H1210',
'H1301',
'H1302',
'H1303',
'H1401',
'H1402',
'H1403',
'H1404',
'H1501',
'H1502',
'H1503',
'H1504',
'H1505',
'H1506',
'H2101',
'H2102',
'H2201',
'H2202',
'H2203',
'H2204',
'H2205',
'H2206',
'H2207',
'H2208',
'H2209',
'H2301',
'H2401',
'H2402',
'H2403',
'H2404',
'H2405',
'H2406',
'H2407',
'H2408',
'H2409',
'H2410',
'H2411',
'H2412',
'H2413',
'H2414',
'H2415',
'H2501',
'H2502',
'H2503',
'H2504',
'H2505',
'H2601',
'H2602',
'H2603',
'H2604',
'H2605',
'H2701',
'H2801',
'H2802',
'H2803',
'H2804',
'H2805',
'H2901',
'H2902',
'H2903',
'H2904',
'H2905',
'H2906',
'H2907',
'H2908',
'H2909',
'H2910',
'H2911',
'H2912',
'H2913',
'H2914',
'H3101',
'H3102',
'H3201',
'H3202',
'H3203',
'H3301',
'H3302',
'H3303',
'H3401',
'H3402',
'H3403',
'H3404',
'I1101',
'I1102',
'I1103',
'I1201',
'I1202',
'I1203',
'I1301',
'I1302',
'I1303',
'I1304',
'I1305',
'I1306',
'I1307',
'I1308',
'I1309',
'I1310',
'I1401',
'I1402',
'I1501',
'I1502',
'I1503',
'I1601',
'I1602',
'I1603',
'I1604',
'I1605',
'I1606',
'I1607',
'J1101',
'J1102',
'J1103',
'J1104',
'J1201',
'J1202',
'J1301',
'J1302',
'J1303',
'J1304',
'J1305',
'J1306',
'J1307',
'J1401',
'J1402',
'J1403',
'J1404',
'J1405',
'J1406',
'J1407',
'J1408',
'J1409',
'J1410',
'J1411',
'J1412',
'J1501',
'J1502',
'J1503',
'J1504',
'J1505',
'J1506',
'J1507',
'K1101',
'K1102',
'K1103',
'K1104',
'K1201',
'K1202',
'K1203',
'K1204',
'K1205',
'K1206',
'K1207',
'K1301',
'K1302',
'K1303',
'K1304',
'K1305',
'K1401',
'K1402',
'K1403',
'K1404',
'K1405',
'K1501',
'K1502',
'K1503',
'K1504',
'K1505',
'K1601',
'K1602',
'K1701',
'K1702',
'K1703',
'K1704',
'K1705',
'K1706',
'K1707',
'K1801',
'K1802',
'K1901',
'K1902',
'K1903',
'K1904',
'K2101',
'K2102',
'K2103',
'K2104',
'K2105',
'K2106',
'K2107',
'K2108',
'K2109',
'K2110',
'K2111',
'K2112',
'K2201',
'K2202',
'K2203',
'K2204',
'K2301',
'K2302',
'K2303',
'K2304',
'K2305',
'K2306',
'K2401',
'K2402',
'K2501',
'K2502',
'K2503',
'K2601',
'K2602',
'K2603',
'L1101',
'L1102',
'L1103',
'L1201',
'L1202',
'L1203',
'L1204',
'L1301',
'L1302',
'L1303',
'L1304',
'L1401',
'L1501',
'L1502',
'L1503',
'L1504',
'L1505',
'L1506',
'L1507',
'L1508',
'L1509',
'L1510',
'M1101',
'M1102',
'M1201',
'M1202',
'M1203',
'M1204',
'M1205',
'M1206',
'M1207',
'M1301',
'M1302',
'M1401',
'M1402',
'M1403',
'M1404',
'M1501',
'M1502',
'M1503',
'M1601',
'M1602',
'M1603',
'M1604',
'M1605',
'M1606',
'M1607',
'M1608',
'M1609',
'M1701',
'M1702',
'M1703',
'M1704',
'M1705',
'M1706',
'M1707',
'M1801',
'M1802',
'M1803',
'M1804',
'M1805',
'M1806',
'M1807',
'M1808',
'M1809',
'M1810',
'N1101',
'N1102',
'N1103',
'N1104',
'N1105',
'N1201',
'N1202',
'N1301',
'N1302',
'N1303',
'N2101',
'N2102',
'N2201',
'N2202',
'N2203',
'N2204',
'N2205',
'N3101',
'N3102',
'N3103',
'N3201',
'N3202',
'N3203',
'N4101',
'N4102',
'N4103',
'N4104',
'N4105',
'N4201',
'N4202',
'N4203',
'N4204',
'N4301',
'N4302',
'N4401',
'N4402',
'N4403'
];

// Liste des positions avec les codes INSEE correspondants
const positions = [
  { lat: 48.12866, lon: -2.21260, insee: '35234' },
  { lat: 49.27703, lon: 2.28029, insee: '60575' },
  { lat: 48.33565, lon: 5.61372, insee: '88270' },
  { lat: 46.17065, lon: 0.22199, insee: '86237' },
  { lat: 46.54239, lon: 2.87217, insee: '03282' },
  { lat: 46.62781, lon: 5.64658, insee: '39550' },
  { lat: 44.59944, lon: 5.48094, insee: '26262' },
  { lat: 44.82028, lon: 2.45808, insee: '15012' },
  { lat: 44.27402, lon: 0.49115, insee: '47190' },
  { lat: 43.34719, lon: 4.19726, insee: '34129' },
  { lat: 42.75682, lon: 8.23465, insee: '2B047' }
];

async function refreshCollectionJobs(req, res) {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('jobs');
    await collection.deleteMany({});  // Clear existing documents

    let uniqueIds = new Set();  // Set to track unique IDs

    for (const { lat, lon, insee } of positions) {
      for (let i = 0; i < rome_codes.length; i += 20) {
        const segment = rome_codes.slice(i, Math.min(i + 20, rome_codes.length)).join('%2C');
        const url = `https://labonnealternance-recette.apprentissage.beta.gouv.fr/api/v1/jobs?romes=${segment}&caller=%20&latitude=${lat}&longitude=${lon}&radius=200&insee=${insee}`;

        const response = await limiter.schedule(() => fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        }));

        if (!response.ok) {
          console.error(`Failed to fetch data for INSEE code ${insee} with ROME codes ${segment}: ${response.statusText}`);
          continue;
        }

        const data = await response.json();
        if (data && data.lbaCompanies && Array.isArray(data.lbaCompanies.results)) {
          const filteredJobs = data.lbaCompanies.results.filter(job => !uniqueIds.has(job.id));
          filteredJobs.forEach(job => uniqueIds.add(job.id));
          
          if (filteredJobs.length > 0) {  // Only attempt to insert if there are jobs to insert
            await collection.insertMany(filteredJobs);
            console.log(`Inserted ${filteredJobs.length} unique jobs for INSEE code ${insee} with ROME codes ${segment}`);
          } else {
            console.log(`No new unique jobs to insert for INSEE code ${insee} with ROME codes ${segment}`);
          }
        } else {
          console.error('No jobs data found or incorrect format', data);
        }
      }
    }
    res.status(201).send('All jobs have been refreshed and inserted into the collection.');
  } catch (error) {
    console.error("Error refreshing jobs from API:", error);
    res.status(500).send({ message: error.message });
  }
}

export { refreshCollectionJobs };
