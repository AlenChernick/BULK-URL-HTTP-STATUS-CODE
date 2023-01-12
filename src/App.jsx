import React, { useState } from 'react';
import Papa from 'papaparse';
import FileSaver from 'file-saver';
import { SyncLoader } from 'react-spinners';
import ReactPaginate from 'react-paginate';

function App() {
  const [urls, setUrls] = useState([]);
  const [responseCodes, setResponseCodes] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(5);

  // Regular expression to check if URLs are in a valid format
  const urlRegex = new RegExp('^(http|https)://');

  //Place holder text
  const placeHolderText = `Enter your urls example:
  https://www.example.com
  https://www.example.com
  https://www.example.com
  https://www.example.com
  https://www.example.com
  `;

  const validateUrls = () => {
    setError(null);
    const invalidUrls = urls.filter((url) => !urlRegex.test(url.trim()));
    if (invalidUrls.length > 0) {
      setError(`The following URLs are invalid: ${invalidUrls.join(', ')}`);
      return false;
    }
    return true;
  };

  const getResponseCodes = async () => {
    setIsLoading(true);
    if (!validateUrls()) {
      setIsLoading(false);
      return;
    }

    const codes = await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url.trim());
          return response.status;
        } catch (error) {
          return null;
        }
      })
    );
    setResponseCodes(codes);
    setIsLoading(false);
  };

  const exportToCsv = () => {
    const rows = [];
    for (let i = 0; i < urls.length; i++) {
      rows.push([urls[i], responseCodes[i] || '-']);
    }
    const csv = Papa.unparse({
      fields: ['URL', 'Response Code'],
      data: rows,
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    FileSaver.saveAs(blob, 'urls-response-codes.csv');
  };

  return (
    <main>
      <h1>BULK URL HTTP STATUS CODE</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <textarea id='url-list' placeholder={placeHolderText} onChange={(event) => setUrls(event.target.value.split('\n').filter(Boolean))}></textarea>
      {isLoading ? (
        <div className='loading-spinner'>
          <SyncLoader color='#646cff' margin={13} size={51} speedMultiplier={1} loading={isLoading} />
        </div>
      ) : (
        <>
          <button onClick={getResponseCodes}>Get Response Codes</button>
          <button
            onClick={() => {
              setUrls([]);
              setResponseCodes([]);
              setError(null);
              document.getElementById('url-list').value = '';
            }}
          >
            Clear
          </button>
          <button onClick={exportToCsv}>Export to CSV</button>
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Response Code</th>
              </tr>
            </thead>
            <tbody>
              {urls.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage).map((url, index) => (
                <tr key={index}>
                  <td>{url}</td>
                  <td>{responseCodes[index] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ReactPaginate
            previousLabel={'<'}
            nextLabel={'>'}
            breakLabel={'....'}
            breakClassName={'break-me'}
            pageCount={Math.ceil(urls.length / itemsPerPage)}
            marginPagesDisplayed={5}
            pageRangeDisplayed={5}
            onPageChange={({ selected }) => setCurrentPage(selected)}
            containerClassName={'pagination'}
            subContainerClassName={'pages pagination'}
            activeClassName={'active'}
          />
        </>
      )}
    </main>
  );
}

export default App;
