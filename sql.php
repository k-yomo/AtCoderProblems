<?php
class SQLConnect {
	private function exectute($sql) {
		$dsn = 'mysql:dbname=LAA0348733-atcoder;host=mysql022.phy.lolipop.lan';
		$user = 'LAA0348733';
		$password = 'escherichia';
		
		try {
			$dbh = new PDO ( $dsn, $user, $password );
			
			$dbh->query ( 'SET NAMES sjis' );
			$stmt = $dbh->query ( $sql );
			
			return $stmt;
		} catch ( PDOException $e ) {
			print ('Error:' . $e->getMessage ()) ;
			die ();
		}
	}
	
	// コンテストを追加してくれる
	public function insertContest($name) {
		$query = "SELECT * FROM contests where name='$name'";
		$data = $this->exectute ( $query );
		if (! $data->fetch ( PDO::FETCH_ASSOC )) {
			$query = "INSERT INTO contests (name) VALUES ('$name')";
			$this->exectute ( $query );
		}
	}
	
	// コンテストの存在・開始時刻・終了時刻をアップデートする
	public function updateContest($name, $bool, $start, $end) {
		$query = "UPDATE contests SET exist=$bool, start=$start, end=$end WHERE name='$name'";
		$this->exectute ( $query );
	}
	
	// コンテスト一覧を引っ張ってくる
	public function pullContests() {
		$query = "SELECT id,name FROM contests";
		return $this->exectute ( $query );
	}
}