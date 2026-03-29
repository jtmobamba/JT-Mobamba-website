"""
JT Mobamba MCP SDK for Python
Official SDK for connecting to JT Mobamba Cloud Database

Example:
    from jtmobamba import JTMobamba

    db = JTMobamba(
        api_key='jtm_your_api_key',
        secret_key='jtms_your_secret_key'
    )

    # Fetch data
    users = db.table('users').select()

    # Insert data
    db.table('users').insert({'name': 'John', 'email': 'john@example.com'})
"""

import requests
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass
from urllib.parse import urljoin, urlencode


__version__ = "1.0.0"
__all__ = ["JTMobamba", "TableQuery", "JTMobambaError"]


class JTMobambaError(Exception):
    """Custom exception for JT Mobamba SDK errors"""
    pass


@dataclass
class QueryResult:
    """Result of a SELECT query"""
    data: List[Dict[str, Any]]
    pagination: Optional[Dict[str, int]] = None


class TableQuery:
    """Query builder for table operations"""

    def __init__(self, client: "JTMobamba", table_name: str):
        self._client = client
        self._table_name = table_name
        self._where: Dict[str, Any] = {}
        self._order_by: Optional[str] = None
        self._order_dir: str = "ASC"
        self._limit: Optional[int] = None
        self._offset: Optional[int] = None
        self._page: Optional[int] = None

    def where(self, conditions: Dict[str, Any]) -> "TableQuery":
        """Add WHERE conditions"""
        self._where.update(conditions)
        return self

    def order_by(self, column: str, direction: str = "ASC") -> "TableQuery":
        """Order results by column"""
        self._order_by = column
        self._order_dir = direction.upper()
        return self

    def limit(self, count: int) -> "TableQuery":
        """Limit number of results"""
        self._limit = count
        return self

    def offset(self, count: int) -> "TableQuery":
        """Skip number of results"""
        self._offset = count
        return self

    def page(self, page_number: int, page_size: int = 50) -> "TableQuery":
        """Paginate results"""
        self._page = page_number
        self._limit = page_size
        return self

    def select(self) -> QueryResult:
        """Execute SELECT query and return results"""
        params = {}

        if self._page:
            params["page"] = self._page
        if self._limit:
            params["limit"] = self._limit
        if self._order_by:
            params["orderBy"] = self._order_by
            params["orderDir"] = self._order_dir
        if self._offset:
            params["offset"] = self._offset

        # Add where conditions
        params.update(self._where)

        query_string = urlencode(params) if params else ""
        endpoint = f"/tables/{self._table_name}/rows"
        if query_string:
            endpoint += f"?{query_string}"

        result = self._client._request(endpoint, "GET")
        return QueryResult(
            data=result.get("data", []),
            pagination=result.get("pagination")
        )

    def insert(self, data: Union[Dict[str, Any], List[Dict[str, Any]]]) -> Dict[str, Any]:
        """Insert one or more rows"""
        return self._client._request(
            f"/tables/{self._table_name}/rows",
            "POST",
            data
        )

    def update(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update rows matching WHERE conditions"""
        return self._client._request(
            f"/tables/{self._table_name}/rows",
            "PUT",
            {"data": data, "where": self._where}
        )

    def update_by_id(self, row_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a specific row by ID"""
        return self._client._request(
            f"/tables/{self._table_name}/rows/{row_id}",
            "PUT",
            data
        )

    def delete(self) -> Dict[str, Any]:
        """Delete rows matching WHERE conditions"""
        if not self._where:
            raise JTMobambaError("WHERE conditions required for delete")

        return self._client._request(
            f"/tables/{self._table_name}/rows",
            "DELETE",
            {"where": self._where}
        )

    def delete_by_id(self, row_id: int) -> Dict[str, Any]:
        """Delete a specific row by ID"""
        return self._client._request(
            f"/tables/{self._table_name}/rows/{row_id}",
            "DELETE"
        )

    def count(self) -> int:
        """Count rows matching conditions"""
        result = self.limit(1).select()
        return result.pagination.get("total", 0) if result.pagination else 0

    def first(self) -> Optional[Dict[str, Any]]:
        """Get first row matching conditions"""
        result = self.limit(1).select()
        return result.data[0] if result.data else None


class JTMobamba:
    """
    JT Mobamba MCP Client

    Args:
        api_key: Your API key (starts with 'jtm_')
        secret_key: Your secret key (starts with 'jtms_')
        base_url: API base URL (default: https://api.jtmobamba.com/api/database/v1/data)
        timeout: Request timeout in seconds (default: 30)

    Example:
        >>> db = JTMobamba(api_key='jtm_...', secret_key='jtms_...')
        >>> users = db.table('users').select()
        >>> print(users.data)
    """

    def __init__(
        self,
        api_key: str,
        secret_key: str,
        base_url: str = "https://api.jtmobamba.com/api/database/v1/data",
        timeout: int = 30
    ):
        if not api_key or not secret_key:
            raise JTMobambaError("api_key and secret_key are required")

        self._api_key = api_key
        self._secret_key = secret_key
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._session = requests.Session()
        self._session.headers.update({
            "Content-Type": "application/json",
            "X-API-Key": api_key,
            "X-API-Secret": secret_key
        })

    def _request(
        self,
        endpoint: str,
        method: str = "GET",
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make an API request"""
        url = f"{self._base_url}{endpoint}"

        try:
            response = self._session.request(
                method=method,
                url=url,
                json=data if data else None,
                timeout=self._timeout
            )

            result = response.json()

            if not response.ok:
                raise JTMobambaError(result.get("error", f"Request failed: {response.status_code}"))

            return result

        except requests.exceptions.Timeout:
            raise JTMobambaError("Request timeout")
        except requests.exceptions.RequestException as e:
            raise JTMobambaError(f"Request failed: {str(e)}")

    def table(self, table_name: str) -> TableQuery:
        """Start a query on a table"""
        return TableQuery(self, table_name)

    def sql(self, query: str) -> Dict[str, Any]:
        """Execute raw SQL query"""
        return self._request("/sql", "POST", {"sql": query})

    def info(self) -> Dict[str, Any]:
        """Get collection info and list of tables"""
        return self._request("/info")

    def tables(self) -> List[Dict[str, Any]]:
        """List all tables"""
        result = self._request("/tables")
        return result.get("tables", [])

    def describe(self, table_name: str) -> Dict[str, Any]:
        """Get table structure"""
        return self._request(f"/tables/{table_name}")

    def ping(self) -> bool:
        """Test connection"""
        try:
            self.info()
            return True
        except JTMobambaError:
            return False

    def close(self):
        """Close the session"""
        self._session.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
